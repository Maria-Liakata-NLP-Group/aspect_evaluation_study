/** @format */

import { useEffect } from "react";

// Full-screen image viewer; closes with ×, Esc or a click on the background
const ImageModal = ({ src, alt, onClose }) => {
	useEffect(() => {
		if (!src) return;
		const handleKeyDown = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [src, onClose]);

	return (
		<div className={`modal ${src ? "is-active" : ""}`}>
			<div
				className="modal-background"
				onClick={onClose}
			></div>
			<div className="modal-content image-modal-content">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				{src && <img src={src} alt={alt} />}
			</div>
			<button
				className="modal-close is-large"
				aria-label="close"
				onClick={onClose}
			></button>
		</div>
	);
};

export default ImageModal;
