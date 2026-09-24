/** @format */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

const EnterID = ({ nextButtonFunction }) => {
	const [id, setId] = useState("");
	const router = useRouter();

	const handleInputChange = (event) => {
		setId(event.target.value);
	};

	const handleNextButtonClick = () => {
		if (id) {
			nextButtonFunction(id);
		} else {
			alert("Please enter your ID");
		}
	};

	// Function executed when router changed
	useEffect(() => {
		if (router.isReady) {
			const { ID } = router.query;

			// Set ID from query parameters
			if (ID) {
				setId(ID);
			}
		}
	}, [router.isReady, router.query]);

	return (
		<section className="section">
			<h1 className="title mt-2">Welcome to the Radiology Rating Study.</h1>
			<p className="mt-4">Please enter your ID in the field below.</p>
			<div className="field mt-2 mb-5">
				<label className="label">ID</label>
				<div className="control">
					<input
						className="input"
						type="text"
						value={id}
						placeholder={"Enter your ID"}
						onChange={handleInputChange}
					/>
				</div>
			</div>
			<div className="mt-5">
				<button
					className="button mt-4"
					onClick={handleNextButtonClick}
				>
					Next
				</button>
			</div>
		</section>
	);
};

export default EnterID;
