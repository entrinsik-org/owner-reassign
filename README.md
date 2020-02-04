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

