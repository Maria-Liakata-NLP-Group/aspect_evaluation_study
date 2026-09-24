/** @format */

import { useState, useRef, useCallback } from "react";
import ImageModal from "./imageModal";
import LikertItem from "./likertItem";
import { LIKERT_ITEMS } from "@/lib/study.mjs";

const VIEWS = ["frontal", "lateral"];

const AnnotationPanel = ({ caseData, caseNumber, totalCases, onSubmit }) => {
	const [ratings, setRatings] = useState(LIKERT_ITEMS.map(() => null));
	const [comment, setComment] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [enlargedView, setEnlargedView] = useState(null);
	const startTime = useRef(Date.now()); // Panel is remounted per case, so this is the case start

	const allAnswered = ratings.every((rating) => rating !== null);
	const closeModal = useCallback(() => setEnlargedView(null), []);

	const setRating = (itemIndex, score) => {
		setRatings((previous) =>
			previous.map((rating, i) => (i === itemIndex ? score : rating)),
		);
	};

	const handleNext = async () => {
		if (!allAnswered || saving) return;
		setSaving(true);
		setError("");
		try {
			await onSubmit({
				ratings,
				comment,
				durationMs: Date.now() - startTime.current,
			});
		} catch (submitError) {
			console.error("Error saving response:", submitError);
			setError(
				"Could not save your response. Please check your connection and try again.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<section className="section">
			<h1 className="title mb-3">
				Case {caseNumber} / {totalCases}
			</h1>
			<progress
				className="progress is-small is-link"
				value={caseNumber - 1}
				max={totalCases}
			/>

			<div className="box">
				<h2 className="subtitle mb-2">Clinical indication</h2>
				<p>{caseData.indication}</p>
			</div>

			<div className="columns">
				{VIEWS.map((view) => (
					<div
						className="column"
						key={view}
					>
						<button
							type="button"
							className="xray-button"
							onClick={() => setEnlargedView(view)}
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={caseData.images[view]}
								alt={`${view} chest X-ray`}
							/>
						</button>
						<p className="xray-caption">{view} (click to enlarge)</p>
					</div>
				))}
			</div>

			<div className="box">
				<h2 className="subtitle mb-2">AI-generated report</h2>
				<p className="report-text">{caseData.report}</p>
			</div>

			<div className="box">
				<h2 className="subtitle">
					How much do you agree with the following statements?
				</h2>
				{LIKERT_ITEMS.map((statement, i) => (
					<LikertItem
						key={statement}
						number={i + 1}
						statement={statement}
						value={ratings[i]}
						onChange={(score) => setRating(i, score)}
						disabled={saving}
					/>
				))}
			</div>

			<div className="field">
				<label
					className="label"
					htmlFor="comment"
				>
					Comment (optional)
				</label>
				<textarea
					id="comment"
					className="textarea"
					rows={3}
					value={comment}
					onChange={(event) => setComment(event.target.value)}
					disabled={saving}
				/>
			</div>

			{error && <div className="notification is-danger">{error}</div>}

			<button
				className={`button is-link ${saving ? "is-loading" : ""}`}
				onClick={handleNext}
				disabled={!allAnswered || saving}
			>
				Next
			</button>
			{!allAnswered && (
				<p className="help">Please rate all 7 statements to continue.</p>
			)}

			<ImageModal
				src={enlargedView ? caseData.images[enlargedView] : null}
				alt={enlargedView ? `${enlargedView} chest X-ray` : ""}
				onClose={closeModal}
			/>
		</section>
	);
};

export default AnnotationPanel;
