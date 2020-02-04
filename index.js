'use strict';
const csv = require('csv-parser');
const _ = require('lodash');
const Joi = require('joi');
const P = require('bluebird');
const Boom = require('boom');


const collateOwners = (req, done) => {
    req.pre.monitor.progress({ primary: 'Gathering report ownership data' });
    const owners = {};
    req.pre.upload.readStream()
        .on('headers', headers => Joi.validate(headers,
            Joi.array().items(
                Joi.string().insensitive().valid('username').required(),
                Joi.string().insensitive().valid('id').required()
            ), err => {
                if (err) done(Boom.badRequest('orf file must contain the columns "id" and "username"'));
            })
        )
        .pipe(csv({
            //make sure that the headers are lowercased so the row objects will have lower case keys
            mapHeaders: header => header.toLowerCase()
        }))
        .on('data', chunk => {
            owners[chunk.username] = owners[chunk.username] || [];
            owners[chunk.username].push(chunk.id);
        })
        .on('end', () => {
            done(owners);
        });
};

const createPrincipals = opts => async (req, done) => {
    if (req.payload.createUsers) {
        req.pre.monitor.progress({ primary: 'Creating missing users:' });
        const { User, Domain } = req.server.app.db.models;
        const domain = await Domain.findById(req.payload.domain);
        if (!domain) throw new Error(`Domain ${req.payload.domain} not found!`);
        const createMethodName = _.get(opts, ['domainDriverOptions', domain.type, 'createUser']);
        const createMethod = _.get(req.server.methods, createMethodName);
        if (!createMethod) done(Boom.preconditionFailed(`Server method ${createMethodName} not registered, conversion aborting.`));
        return P.all(
            _.map(req.pre.owners, async (v, k) => {
                try {
                    const user = await createMethod(k.toLowerCase(), domain);
                    user.username = user.username.toLowerCase();
                    const [, created] = await User.findOrCreate({
                        where: {
                            username: k.toLowerCase(),
                            domain: req.payload.domain
                        },
                        defaults: user
                    });
                    req.pre.monitor.progress({ primary: `${created ? 'Created' : 'Found'} user ${k} ` });
                } catch (e) {
                    console.log(e);
                }
            })).nodeify(done);
    }
    done();
};

const reassignOwners = (req, done) => {
    const sequelize = req.server.app.db.sequelize;
    return P.all(_.map(req.pre.owners, async (v, k) => {
        try {

            const res = await sequelize.query('update query set "ownerId" = :ownerId where "sourceId" in (:sourceIds)',
                { replacements: { ownerId: k.toLowerCase(), sourceIds: v } }
            );
            req.pre.monitor.progress({ primary: `Reassigned ${res[0]} reports to ${k}` });

        } catch (e) {
            console.log(e);
        }
    })).nodeify(done);
};

exports.register = function (server, opts, next) {
    server.driver('importer', {
        discover: function (req) {
            if (req.pre.upload.filename.endsWith('.orf')) {
                return {
                    name: 'Reassign Imported Ad Hoc Reports',
                    editorComponent: 'reassignReportOwners'
                };
            }
        },
    });
    server.route({
        path: '/import/report/reassign',
        method: 'post',
        config: {
            pre: [
                { assign: 'monitor', method: (r, d) => d(r.monitor(r.payload.progress)) },
                { assign: 'upload', method: 'upload.lookup(payload.upload)' },
                { assign: 'owners', method: collateOwners },
                { method: createPrincipals(opts) }
            ],
            handler: reassignOwners,
            plugins: {
                hal: {
                    api: 'inf:reassign-report-owners'
                }
            },
            validate: {
                payload: {
                    upload: Joi.string(),
                    progress: Joi.string(),
                    createUsers: Joi.boolean(),
                    domain: Joi.string().optional()
                }
            },
            timeout: {
                socket: false
            }
        }
    });
    server.route({
        path: '/import/report/reassign-options',
        method: 'get',
        config: {
            handler: async (req, reply) => {
                /*
                    "@entrinsik/informer-owner-reassign": {
                        "domainDriverOptions" : {
                            "domain-driver-1" : {"createUser": "custom.server.method"},
                            "domain-driver-2" : {"createUser": "custom.server.method", "foo":"bar"}
                        }
                    }
                    if present, then return a list of domains with eligible drivers, otherwise return {}
                 */
                const drivers = _.map(_.get(opts, 'domainDriverOptions'), (v, k) => k);
                if (drivers && drivers.length) {
                    const { Domain } = server.app.db.models;
                    const domains = await Domain.findAll();
                    reply(domains.filter(d => _.includes(drivers, d.type)));
                } else {
                    reply();
                }

            },
            plugins: {
                hal: {
                    api: 'inf:reassign-report-owners-options'
                }
            }
        }
    });
    server.injector().inject(server.bundle('reassign').scan(__dirname, 'public'));
    next();
};

exports.register.attributes = { name: 'owner-reassign' };
