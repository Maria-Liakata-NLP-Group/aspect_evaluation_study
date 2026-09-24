/** @format */

const Guidelines = () => {
	return (
		<div className="content">
			<p>
				Imagine the following scenario. A referring clinician has requested a
				chest X-ray for one of their patients, providing a short clinical
				indication explaining what they want examined. You are the radiologist
				receiving the request. Once the X-ray has been taken, it is uploaded to
				your practice&apos;s system, which automatically generates a draft
				report.
			</p>
			<p>
				We are evaluating how useful these AI-generated reports are and whether
				they meet the requirements radiologists have for a good report. Through
				interviews with radiologists, we have identified seven such
				requirements. Your task is to rate each report against these seven
				requirements.
			</p>
			<h3>What you will see for each case</h3>
			<ul>
				<li>The clinical indication provided by the referring clinician.</li>
				<li>The frontal and lateral X-ray images.</li>
				<li>The AI-generated report.</li>
			</ul>
			<h3>What you will do</h3>
			<p>
				For each report, rate your agreement with seven statements on a
				5-point Likert scale from Completely disagree (1) to Completely agree
				(5). An optional free-text comment box is provided if you want to
				explain your reasoning or flag anything unusual.
			</p>
			<h3>Definitions to keep consistent across raters</h3>
			<ul>
				<li>
					The referring clinician is the doctor who ordered the X-ray. In this
					study, cases come from a US teaching hospital&apos;s emergency and
					inpatient services rather than primary care, so the referrer is
					typically a hospital physician.
				</li>
				<li>
					The clinical question is the reason for the X-ray as stated or
					implied in the indication.
				</li>
				<li>
					Six of the seven items ask you to evaluate the report itself. The
					final item (&ldquo;would save the referring clinician time&rdquo;)
					asks you to consider how the report would function in clinical use.
				</li>
			</ul>
			<p>
				Please rate each report based on your own clinical judgment of what
				the case requires, rather than by comparison to any specific reference
				report. Take the time you need &mdash; there is no time pressure
				&mdash; but try to rate each case in one sitting to keep your judgments
				consistent.
			</p>
			<p>
				Your ratings will be used to evaluate the AI system and to refine our
				evaluation framework. Individual ratings will not be shared outside the
				research team.
			</p>
			<p>Thank you for your time.</p>
		</div>
	);
};

export default Guidelines;
