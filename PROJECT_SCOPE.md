NEXTMOVE — LOCKED PROTOTYPE SCOPE
Version 0.1

STATUS:
Scope locked.
Do not add features unless they are required to prove the core transformation.

────────────────────────────────────
1. PURPOSE
────────────────────────────────────

NextMove is an AI-powered job application adaptation tool.

The prototype must answer one question only:

Can we transform a person’s real experience and a real job advertisement into a significantly stronger, truthful, and Germany-adapted job application?

This prototype is not a complete SaaS product.
It is not a CV template marketplace.
It is not a job platform.
It is not ready for public launch or payment.

────────────────────────────────────
2. CORE PRODUCT PROMISE
────────────────────────────────────

“Give us your real experience and the job you want. NextMove creates a stronger, honest application adapted to the German hiring market.”

The product may improve:

- Wording
- Structure
- Clarity
- Emphasis
- Professional tone
- Relevance to the job advertisement
- Cultural and market suitability

The product must never invent:

- Work experience
- Employers
- Education
- Skills
- Certificates
- Achievements
- Responsibilities
- Dates
- Languages
- Personal information

────────────────────────────────────
3. INITIAL TARGET USE CASE
────────────────────────────────────

The initial user is a multilingual job seeker applying for a job in Germany.

Accepted input languages:

- Arabic
- Turkish
- English

Supported job advertisement languages:

- German
- English

Supported output languages:

- German
- English

Initial target market:

- Germany only

No Turkey Market Pack.
No international multi-country system.
No additional markets during the prototype.

────────────────────────────────────
4. EXACT USER FLOW
────────────────────────────────────

The prototype contains one main workflow:

STEP 1 — USER EXPERIENCE

The user pastes their existing CV or writes their professional experience as text.

The prototype does not need file upload during the first version.

STEP 2 — JOB ADVERTISEMENT

The user pastes the full job advertisement.

STEP 3 — TARGET SETTINGS

The user selects:

- Output language: German or English
- Job advertisement language: German or English

The target market is permanently set to Germany.

STEP 4 — GENERATE

The user clicks one button:

“Analyze and Generate”

STEP 5 — RESULTS

The system displays three results:

1. Match Analysis
2. Tailored CV
3. Tailored Cover Letter

────────────────────────────────────
5. REQUIRED OUTPUTS
────────────────────────────────────

A. MATCH ANALYSIS

The analysis must contain:

- Job title and company, when identifiable
- Main job requirements
- Confirmed strengths from the user’s experience
- Partial matches
- Missing or unconfirmed requirements
- Experience that should be emphasized
- German-market adaptation notes
- Questions requiring clarification

The system must not assign a fake scientific match score.

A simple classification is enough:

- Strong match
- Partial match
- Significant gaps

B. TAILORED CV

The CV must:

- Use only confirmed user information
- Prioritize experience relevant to the job
- Use professional German or English
- Follow a clear, ATS-friendly structure
- Remain editable as plain structured text
- Avoid unsupported claims
- Avoid keyword stuffing
- Avoid exaggerated language
- Aim for one or two pages when later formatted

C. TAILORED COVER LETTER

The cover letter must:

- Be adapted to the specific job
- Connect real experience to job requirements
- Use an appropriate professional tone
- Avoid generic motivational clichés
- Avoid invented company knowledge
- Avoid claiming qualifications the user does not have
- Remain concise
- Clearly mark missing recipient information instead of inventing it

────────────────────────────────────
6. TRUTH LOCK
────────────────────────────────────

Truth Lock is mandatory and is the prototype’s most important rule.

Before generating documents, the system must create a structured Source of Truth from the user’s input.

Every factual statement in the generated CV and cover letter must be supported by that Source of Truth.

Information must be classified as:

CONFIRMED:
Directly stated in the user’s experience.

REPHRASED:
The same confirmed information expressed more professionally.

INFERRED BUT UNCONFIRMED:
A reasonable possibility that must be shown as a question or suggestion.

MISSING:
Required by the job advertisement but unsupported by the user’s information.

Inferred or missing information must never be inserted into the final documents as fact.

When important information is missing, the system must say:

“Please confirm or provide this information.”

────────────────────────────────────
7. GERMANY MARKET PACK V0
────────────────────────────────────

The first Germany Market Pack must remain conservative.

It should include:

- Formal and professional tone
- Clear reverse-chronological experience structure
- Consistent date formatting
- Concise language
- Direct connection between experience and requirements
- Clear separation of skills, languages, work, and education
- One-page cover letter target
- No exaggeration
- No irrelevant personal information
- No invented recipient name
- No guaranteed claims about what every German employer expects

Photo, signature, birth date, nationality, marital status, and similar personal details must not be automatically added.

The prototype may mention them as optional decisions requiring user confirmation.

────────────────────────────────────
8. REQUIRED SCREENS
────────────────────────────────────

Only three functional screens are required.

SCREEN 1 — INPUT

Contains:

- Product name and short promise
- User experience text area
- Job advertisement text area
- Output language selector
- Generate button

SCREEN 2 — PROCESSING

Contains a simple progress state:

- Reading experience
- Analyzing the job
- Applying Germany Market Pack
- Checking truthfulness
- Generating documents

SCREEN 3 — RESULTS

Contains three tabs or sections:

- Match Analysis
- CV
- Cover Letter

Required actions:

- Copy text
- Regenerate once
- Return to input

No advanced editor is required.

────────────────────────────────────
9. STRICTLY OUT OF SCOPE
────────────────────────────────────

Do not build:

- Accounts
- Login or registration
- Database
- Application tracker
- Payments
- Credit system
- PDF export
- DOCX export
- File upload
- CV templates
- Interview preparation
- Follow-up messages
- Voice features
- Job search
- Job scraping
- Automatic applications
- LinkedIn integration
- Email integration
- Recruiter tools
- Employer dashboards
- Native mobile apps
- Turkey Market Pack
- Additional countries
- Analytics dashboards
- Referral systems
- Social features

A feature being useful does not mean it belongs in the prototype.

────────────────────────────────────
10. TECHNICAL APPROACH
────────────────────────────────────

The prototype should be a responsive web application.

Recommended structure:

- Simple frontend
- One secure backend generation endpoint
- One AI provider initially
- Static Germany Market Pack configuration
- Structured JSON output from the AI
- Environment variable for the API key
- No API key exposed in the browser
- Basic input length limits
- Basic error handling
- Basic rate limiting during testing

The system should separate the AI workflow into stages:

1. Parse user experience
2. Parse job advertisement
3. Compare and create strategy
4. Generate CV
5. Generate cover letter
6. Run Truth Lock validation
7. Return structured results

The final validator should compare generated factual claims against the Source of Truth and flag unsupported claims.

────────────────────────────────────
11. TESTING REQUIREMENTS
────────────────────────────────────

Test the prototype with at least ten real cases.

The test set should include:

- Arabic experience to German output
- Turkish experience to German output
- English experience to German output
- Arabic experience to English output
- Job advertisements with clear requirements
- Job advertisements with vague requirements
- Users with strong matches
- Users with significant gaps
- Users with incomplete CVs
- Long and poorly written experience descriptions

Each result should be reviewed for:

- Truthfulness
- Language quality
- Job relevance
- German-market suitability
- Generic wording
- Unsupported claims
- Missing information handling
- Amount of editing required

────────────────────────────────────
12. SUCCESS CRITERIA
────────────────────────────────────

The prototype succeeds when:

- At least 8 of 10 outputs contain no invented factual claims
- At least 7 of 10 users say the result is clearly better than their original application
- At least 7 of 10 users would use it for a real job application
- At least 5 of 10 users state they would pay for another application pack
- Generated documents require limited correction rather than complete rewriting
- The core result remains consistent across repeated tests

────────────────────────────────────
13. FAILURE / KILL CRITERIA
────────────────────────────────────

Stop expanding the product and repair the core engine if:

- The AI repeatedly invents information
- Outputs feel generic or equivalent to a basic ChatGPT prompt
- German output requires extensive rewriting
- Cultural adaptation cannot be clearly noticed
- Users do not trust the generated claims
- Most users would not use the documents in a real application
- The generation cost becomes unreasonable
- The workflow cannot reliably process common CV formats as pasted text

Do not solve weak AI quality by adding more features or improving visual design.

────────────────────────────────────
14. TIME LIMIT
────────────────────────────────────

Development commitment:

- Two focused hours per day
- Target duration: 7–12 working days
- Maximum prototype duration: 15 working days

If the prototype is not functional after 15 working days, reduce the scope further.

────────────────────────────────────
15. DEFINITION OF DONE
────────────────────────────────────

The prototype is complete when a tester can:

1. Paste real professional experience.
2. Paste a real German or English job advertisement.
3. Select German or English output.
4. Generate a structured match analysis.
5. Receive a truthful tailored CV.
6. Receive a truthful tailored cover letter.
7. Copy all three outputs.
8. Clearly see which requirements are missing or unconfirmed.

Nothing else is required for Version 0.1.

────────────────────────────────────
FINAL RULE
────────────────────────────────────

The prototype exists to prove output quality, truthfulness, and willingness to pay.

It does not exist to prove that we can build many screens.
