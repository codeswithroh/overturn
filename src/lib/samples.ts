// Fictional denial letters for demos. Names, IDs and insurers are made up.
export const SAMPLES = [
  {
    id: "mri",
    label: "Lumbar MRI · medical necessity",
    blurb: "Back pain with leg numbness after 7 weeks of PT. MRI denied.",
    text: `LONESTAR UNITED HEALTH PLANS
Utilization Management Department
P.O. Box 44120, Austin, TX 78744

Date: October 14, 2026

Member: Dana Whitfield
Member ID: LUH-88231904
Group: Brazos Logistics LLC (Employer Group Plan #20417)
Claim / Reference #: UM-2026-1017733
Requesting Provider: Priya Raman, MD, Hill Country Spine & Sports

NOTICE OF ADVERSE BENEFIT DETERMINATION

Service requested: MRI lumbar spine without contrast (CPT 72148)
Diagnosis: M54.16 Radiculopathy, lumbar region; M51.26 Other intervertebral disc displacement, lumbar region

We reviewed the request for the service listed above. This service is not approved.

Reason for denial: The requested imaging does not meet medical necessity criteria under Clinical Policy CP-RAD-114 (Advanced Imaging of the Spine). Imaging for low back pain is not considered medically necessary in the absence of red-flag symptoms or failure of at least 6 weeks of conservative therapy. The documentation submitted does not demonstrate failure of conservative therapy.

This decision was made by a physician reviewer board-certified in Family Medicine.

YOUR RIGHT TO APPEAL: You or your authorized representative may file an appeal within 180 days of receiving this notice. You may submit written comments, documents, and other information. You are entitled to receive, upon request and free of charge, copies of all documents relevant to your claim. If your appeal is denied you may have the right to an independent external review.

Send appeals to: LUH Appeals Unit, P.O. Box 44190, Austin, TX 78744. Fax: (512) 555-0143.`,
  },
  {
    id: "cgm",
    label: "Glucose monitor · not covered",
    blurb: "Type 2 diabetes on insulin. CGM denied as 'convenience item'.",
    text: `PACIFIC CREST HEALTH (Covered California Silver 87 HMO)
Member Services, 2200 Harbor Blvd, Sacramento, CA 95814

September 30, 2026

Re: Member Marcus Oyelaran, ID PCH-55102274
Prior authorization request #PA-0930-77812
Item: Continuous glucose monitor system and sensors (HCPCS E2103, A4239)
Diagnosis: E11.65 Type 2 diabetes mellitus with hyperglycemia; Z79.4 Long-term use of insulin

DECISION: DENIED

Explanation: Per Pacific Crest Medical Policy MP-DME-031, continuous glucose monitors are covered only for members with Type 1 diabetes or members with Type 2 diabetes using an insulin pump or three or more daily injections. Records indicate the member uses basal insulin once daily. CGM is considered a convenience item for this member, and fingerstick glucose testing is an adequate alternative.

You may request an appeal (grievance) within 180 days. If you disagree with our decision after the grievance process, you may apply for an Independent Medical Review (IMR) through the California Department of Managed Health Care. If your health is in serious jeopardy you may request an expedited review.`,
  },
  {
    id: "er",
    label: "Emergency surgery · no prior auth",
    blurb: "Appendectomy from the ER. Hospital stay denied for no prior authorization.",
    text: `GREAT LAKES MUTUAL HEALTH
Claims Department, 400 W Wacker Dr, Chicago, IL 60606

EXPLANATION OF BENEFITS / CLAIM DENIAL
Date of notice: October 2, 2026

Patient: Sofia Brennan    Member ID: GLM-30098141
Plan: Great Lakes Marketplace Bronze PPO (IL)
Claim #: 26-IL-4471902
Provider: St. Columba Medical Center (out-of-network)
Dates of service: September 6–8, 2026

Services: Laparoscopic appendectomy (CPT 44970); inpatient stay 2 days
Diagnosis: K35.80 Unspecified acute appendicitis

Amount billed: $38,412.00    Plan paid: $0.00    Your responsibility: $38,412.00

Reason code PA-07: Inpatient admission was not prior authorized as required under your plan. Services at a non-participating facility require prior authorization.

You have 180 days from the date of this notice to file an internal appeal.`,
  },
] as const;

export type SampleId = (typeof SAMPLES)[number]["id"];
