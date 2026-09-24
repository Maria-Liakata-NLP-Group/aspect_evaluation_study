/** @format */

import Guidelines from "./guidelines";

const Intro = ({ progress, totalCases, onStart }) => {
	return (
		<section className="section narrow-page">
			<h1 className="title mt-2">Welcome to the Radiology Rating Study</h1>
			<p className="mb-4">
				{progress > 0
					? `Welcome back. You have rated ${progress} of ${totalCases} cases and will continue where you left off.`
					: `There are ${totalCases} cases to rate.`}{" "}
				Your progress is saved after every case, so you can take a break at any
				time.
			</p>
			<p className="mb-4">
				Please read the instructions below carefully. You can bring them up
				again at any time by clicking Instructions in the top right corner.
			</p>
			<div className="box">
				<Guidelines />
			</div>
			<button
				className="button is-link"
				onClick={onStart}
			>
				{progress > 0 ? "Continue" : "Start"}
			</button>
		</section>
	);
};

export default Intro;
