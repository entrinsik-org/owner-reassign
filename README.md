# owner-reassign
Reassigns owner to reports, based on csv file downloaded from Informer 4.

Users must exist in I5 for ownership to change.

_**NOTE: this only works if ad-hoc reports in the system come from a single I4, and that instance of I4 is used to generate the report described below. Back up your I5 instance prior to doing this.**_

## Installation
```
npm install @entrinsik/informer-owner-reassign
```

## Usage

1. In Informer 4, set up a datasource for reporting on the Informer system. https://entrinsikincraleigh.zendesk.com/hc/en-us/articles/202359457-How-to-map-the-internal-Informer-database

2. Create a native SQL report using datasource from (1.):

```sql
select r.id, r.owner_sid as username from Report r
```

3. Export this to csv. The filename must end with the extension ".orf" (you can change that after downloading).

4. Drag this file onto Informer 5.

5. Click save.

## Owner creation

Custom domains might not have ways of scanning users into Informer. If a custom domain has identified a server method to create users, that takes the args (username, domain)
To enable this, you need a configuration setting.

```json
    "@entrinsik/informer-owner-reassign" :{
      "domainDriverOptions" : {
        "custom-driver" : {"createUser": "custom.createUser"}
      }
    },
```
Where _custom-driver_ is the id of the custom domain driver and _custom.createUser_ is the name of the server method in the plugin

_*Server method*_ will get passed a username and the domain object. It should return a user object. For example, if users are read from a database, look up the user by the passed in username and return a user object like:

```javascript
{
    username: row.username.toLowerCase(),
    email: row.email,
    displayName: row.name,
    enabled: true,
    password: '123',
    domain: this.domain.id,
    data: {
        company_codes: companyCodes,
        location_codes: locationCodes
    }
};

```
