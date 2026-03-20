@RestResource(urlMapping='/housingApplication/*')
global class ApplicationFormHandler {

    @HttpPost
    global static Map<String, String> handlePost() {
        try {
            RestRequest req = RestContext.request;
            String body    = req.requestBody.toString();

            Map<String, Object> data =
                (Map<String, Object>) JSON.deserializeUntyped(body);

            // ── 1. Create the Applicant record ────────────────────────────
            Applicant__c applicant          = new Applicant__c();
            applicant.First_Name__c         = (String)  data.get('firstName');
            applicant.Last_Name__c          = (String)  data.get('lastName');
            applicant.Email__c              = (String)  data.get('email');
            applicant.Phone__c              = (String)  data.get('phone');
            applicant.Current_Address__c    = (String)  data.get('currentAddress');
            applicant.Employment__c         = (String)  data.get('employment');
            applicant.Gender__c             = (String)  data.get('gender');
            applicant.Status__c             = 'New';
            insert applicant;

            // ── 2. Create the Application record ──────────────────────────
            Application__c app              = new Application__c();
            app.Applicant__c                = applicant.Id;
            app.Property__c                 = (String)  data.get('propertyId');
            app.Household_Size__c           = Integer.valueOf(data.get('householdSize'));
            app.Income_Range__c             = (String)  data.get('incomeRange');
            app.Special_Requirements__c     = (String)  data.get('specialRequirements');
            app.Submitted_Date__c           = DateTime.now();
            app.Status__c                   = 'Submitted';
            insert app;

            // ── 3. Return success ──────────────────────────────────────────
            Map<String, String> result = new Map<String, String>();
            result.put('status',        'success');
            result.put('applicantId',   applicant.Id);
            result.put('applicationId', app.Id);
            result.put('reference',     app.Name);
            result.put('message',       'Application submitted successfully! Reference: ' + app.Name);
            return result;

        } catch (DmlException e) {
            Map<String, String> error = new Map<String, String>();
            error.put('status',  'error');
            error.put('type',    'DMLException');
            error.put('message', e.getDmlMessage(0));
            return error;

        } catch (Exception e) {
            Map<String, String> error = new Map<String, String>();
            error.put('status',  'error');
            error.put('type',    e.getTypeName());
            error.put('message', e.getMessage());
            return error;
        }
    }
}
