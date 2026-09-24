/** @format */

import { useState, useEffect } from "react";
import Head from "next/head";
import AnnotationPanel from "@/components/annotationPanel";
import EnterID from "@/components/enterID";
import Guidelines from "@/components/guidelines";
import Intro from "@/components/intro";
import Navbar from "@/components/navbar";
import xrayCases from "@/data/xray_cases.json";
import { findCase } from "@/lib/study.mjs";

const postJson = async (url, body) => {
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const result = await response.json().catch(() => ({}));
	return { status: response.status, ok: response.ok, result };
};

export default function Home() {
	const [participant, setParticipant] = useState("");
	const [stage, setStage] = useState("id"); // id, loading, intro, annotation, finish
	const [caseIds, setCaseIds] = useState([]); // Case order for this participant
	const [progress, setProgress] = useState(0); // Number of submitted cases = index of current case
	const [showHelp, setShowHelp] = useState(false); // Display instructions in a modal

	// Scroll to top when stage or case changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [stage, progress]);

	const applyState = (state) => {
		setCaseIds(state.caseIds);
		setProgress(state.progress);
		if (state.completed) setStage("finish");
	};

	const proceedFromID = async (id) => {
		setStage("loading");
		try {
			const { status, ok, result } = await postJson("/api/getData", {
				participant: id,
			});
			if (status === 404) {
				alert("ID not recognised. Please check your ID.");
				setStage("id");
				return;
			}
			if (!ok) {
				throw new Error(
					result.error || `Unexpected response status: ${status}`,
				);
			}
			setParticipant(id);
			setStage("intro");
			applyState(result);
		} catch (error) {
			console.error("Error fetching participant data:", error);
			alert("Could not load your data. Please try again.");
			setStage("id");
		}
	};

	// Called by AnnotationPanel; throws on failure so the panel keeps its inputs
	const submitResponse = async ({ ratings, comment, durationMs }) => {
		const { status, ok, result } = await postJson("/api/saveResponses", {
			participant,
			index: progress,
			caseId: caseIds[progress],
			ratings,
			comment,
			durationMs,
		});

		// Out of sync (double submit, other tab): reload state and show the correct case
		if (status === 409) {
			const refreshed = await postJson("/api/getData", { participant });
			if (!refreshed.ok) throw new Error("Failed to reload participant state");
			applyState(refreshed.result);
			return;
		}
		if (!ok) {
			throw new Error(result.error || `Unexpected response status: ${status}`);
		}

		setProgress(result.progress);
		if (result.completed) setStage("finish");
	};

	const getStagePage = () => {
		if (stage === "id") {
			return <EnterID nextButtonFunction={proceedFromID} />;
		} else if (stage === "loading") {
			return (
				<section className="section narrow-page">
					<h1 className="title">Loading...</h1>
				</section>
			);
		} else if (stage === "intro") {
			return (
				<Intro
					progress={progress}
					totalCases={caseIds.length}
					onStart={() => setStage("annotation")}
				/>
			);
		} else if (stage === "annotation") {
			const caseId = caseIds[progress];
			const caseData = findCase(xrayCases, caseId);
			if (!caseData) {
				return (
					<section className="section narrow-page">
						<div className="notification is-danger">
							Case {caseId} could not be found. Please contact the research
							team.
						</div>
					</section>
				);
			}
			return (
				<AnnotationPanel
					key={progress}
					caseData={caseData}
					caseNumber={progress + 1}
					totalCases={caseIds.length}
					onSubmit={submitResponse}
				/>
			);
		} else if (stage === "finish") {
			return (
				<section className="section narrow-page">
					<h1 className="title">Thank you!</h1>
					<p>You have rated all cases. You can close this window.</p>
				</section>
			);
		}
	};

	return (
		<>
			<Head>
				<title>Radiology Report Rating</title>
				<meta
					name="description"
					content="Rating study for AI-generated chest X-ray reports"
				/>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<link
					rel="icon"
					href="/favicon.ico"
				/>
			</Head>
			<Navbar clickOnHelp={() => setShowHelp(true)} />

			<div className={`modal ${showHelp ? "is-active" : ""}`}>
				<div
					className="modal-background"
					onClick={() => setShowHelp(false)}
				></div>
				<div className="modal-content">
					<div className="box">
						<Guidelines />
					</div>
				</div>
				<button
					className="modal-close is-large"
					aria-label="close"
					onClick={() => setShowHelp(false)}
				></button>
			</div>

			<main>{getStagePage()}</main>
		</>
	);
}
