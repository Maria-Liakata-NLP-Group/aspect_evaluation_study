/** @format */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const EnterID = ({ nextButtonFunction }) => {
	const [id, setId] = useState("");
	const router = useRouter();

	const handleSubmit = (event) => {
		event.preventDefault();
		const trimmedId = id.trim();
		if (trimmedId) {
			nextButtonFunction(trimmedId);
		} else {
			alert("Please enter your ID");
		}
	};

	// Set ID from query parameters
	useEffect(() => {
		if (router.isReady && router.query.ID) {
			setId(router.query.ID);
		}
	}, [router.isReady, router.query]);

	return (
		<section className="section narrow-page">
			<h1 className="title mt-2">Welcome to the Radiology Rating Study.</h1>
			<p className="mt-4">Please enter your ID in the field below.</p>
			<form onSubmit={handleSubmit}>
				<div className="field mt-2 mb-5">
					<label
						className="label"
						htmlFor="participant-id"
					>
						ID
					</label>
					<div className="control">
						<input
							id="participant-id"
							className="input"
							type="text"
							value={id}
							placeholder="Enter your ID"
							onChange={(event) => setId(event.target.value)}
						/>
					</div>
				</div>
				<button
					className="button mt-4"
					type="submit"
				>
					Next
				</button>
			</form>
		</section>
	);
};

export default EnterID;
