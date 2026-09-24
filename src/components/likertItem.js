/** @format */

import { SCALE_LABELS } from "@/lib/study.mjs";

const LikertItem = ({ number, statement, value, onChange, disabled }) => {
	return (
		<fieldset className="likert-item">
			<legend className="has-text-weight-semibold mb-3">
				{number}. {statement}
			</legend>
			<div className="likert-scale">
				{SCALE_LABELS.map((label, i) => {
					const score = i + 1;
					return (
						<label
							key={score}
							className={`likert-option ${value === score ? "is-selected" : ""}`}
						>
							<input
								type="radio"
								name={`item_${number}`}
								value={score}
								checked={value === score}
								onChange={() => onChange(score)}
								disabled={disabled}
							/>
							<span>{label}</span>
						</label>
					);
				})}
			</div>
		</fieldset>
	);
};

export default LikertItem;
