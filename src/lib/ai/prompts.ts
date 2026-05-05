/**
 * AI Prompt Templates
 * Context-aware prompts for orthodontic practice reporting
 */

export const EXECUTIVE_SUMMARY_PROMPT = `You are creating an executive summary for a monthly activity report for an orthodontic practice.
This report covers {month} and includes {emailCount} emails and {meetingCount} meetings.

Below is a list of activities with their dates, types, subjects, and participants:

{activityList}

Create a 3 paragraph executive summary that:
1. Opens with a high-level overview of engagement this month, identifying key themes and topics based on the activity subjects and participants
2. Highlights what was accomplished and the value delivered to the practice
3. Looks ahead — based on the activity content, outline what is upcoming or planned next (e.g. scheduled follow-ups, pending actions, next steps discussed in emails or meetings)
4. Maintains a professional, consultative tone throughout

Executive Summary:`;

export const MEETING_SUMMARY_PROMPT = `You are summarizing a meeting for an orthodontic practice's monthly activity report.

Meeting title: {subject}
Attendees: {participants}
Meeting notes:
{notes}

Return a JSON object with:
1. "summary": A brief 2-3 sentence summary of what was discussed and decided
2. "actions": An array of agreed actions or next steps extracted from the notes (empty array if none)

Respond ONLY with valid JSON, no other text. Example format:
{"summary": "The team discussed...", "actions": ["Follow up on X", "Schedule Y"]}`;

export const PERFORMANCE_SUMMARY_PROMPT = `You are creating an executive summary for a monthly performance report for an orthodontic practice called {practiceName}.
This report covers {month} and analyses the patient journey funnel from lead generation through to treatment starts.

Funnel Data:
{funnelData}

Conversion Rates:
{conversionRates}

Revenue Metrics (all in GBP):
- Pipeline Value: {pipelineValue}
- Actual Revenue: {actualRevenue}
- Potential Lost Revenue: {potentialLostRevenue}
- Average Order Value: {aov}

{discrepanciesSection}

Write a 3 paragraph executive summary:
1. Performance overview — summarise funnel performance, highlighting total leads generated and how they progressed through the funnel. Reference specific numbers.
2. Revenue picture — discuss the financial impact, referencing pipeline value, actual revenue from treatment starts, and potential lost revenue. Contextualise with the AOV.
3. Actionable recommendations — provide 2-3 specific, data-driven recommendations to improve conversions at the weakest points in the funnel.

Maintain a professional, consultative tone. Use specific numbers throughout. All monetary values should be in GBP (use the £ symbol).

Executive Summary:`;
