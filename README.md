# owner-reassign
Reassigns owner to reports, based on csv file downloaded from Informer 4. Users must exist in I5 for ownership to change.

## Installation
<code>npm install @entrinsik/informer-owner-reassign</code>

## Use

1. In Informer 4, set up a datasource for reporting on the Informer system. https://entrinsikincraleigh.zendesk.com/hc/en-us/articles/202359457-How-to-map-the-internal-Informer-database

2. Create a native SQL report using this datasource:

<code>select r.id, r.owner_sid as username from Report r inner join Mapping m on r.mapping_Id = m.id where m.datasource_id = <<Enter Datasource Id [Numeric]>> OR r.datasource_id = <<Enter Datasource Id [Numeric]>></code>

3. Export this to csv. The filename must end with the extension ".orf" (you can changethat after download.

4. Drag this file onto Informer 5.

5. Click save.

