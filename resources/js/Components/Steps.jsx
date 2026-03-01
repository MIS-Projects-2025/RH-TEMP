import clsx from "clsx";
import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
export default function Steps({ steps = [], currentStep = 0, stepsClassName }) {
	const [animatedStep, setAnimatedStep] = useState(null);

	useEffect(() => {
		if (currentStep > 0) {
			setAnimatedStep(currentStep - 1);
			const timeout = setTimeout(() => setAnimatedStep(null), 1000);
			return () => clearTimeout(timeout);
		}
	}, [currentStep]);

	const stepColor = (index) => {
		if (index < currentStep) {
			return "step-primary text-primary font-semibold";
		} else if (index === currentStep) {
			return "step-secondary text-secondary font-semibold";
		} else {
			return "step opacity-40";
		}
	};

	return (
		<ul className={clsx("steps", stepsClassName)}>
			{steps.map((label, index) => (
				<li
					key={index}
					className={`step 
                        ${stepColor(index)}
                    `}
				>
					{index < currentStep && (
						<span className={`step-icon`}>
							<FaCheck
								className={`${
									animatedStep === index ? "animate-pop-rainbow" : ""
								}`}
							/>
						</span>
					)}
					<span>{label}</span>
				</li>
			))}
		</ul>
	);
}
