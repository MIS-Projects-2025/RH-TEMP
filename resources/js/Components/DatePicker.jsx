import { useEffect, useRef, useState } from "react";
import {
	default as CalendarContainer,
	default as DatePicker,
} from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SmartCalendarContainer = ({ startDate, endDate, onChange, props }) => {
	const now = new Date();
	const datePickerRef = useRef(null);
	const [currentLabel, setCurrentLabel] = useState("Pick a start date");
	const [step, setStep] = useState(0);

	const handleChange = (dates) => {
		const [start, end] = dates;
		onChange(dates);

		if (!start) setStep(0);
		else if (start && !end) setStep(1);
		else if (start && end) setStep(2);
	};

	const getLabel = () => {
		switch (step) {
			case 0:
				return "Pick a start date and it's time";
			case 1:
				return "Now, pick the end date and it's time";
			case 2:
				return "";
			default:
				return "Pick a start date and it's time";
		}
	};

	const setRange = (start, end) => {
		onChange([start, end]);

		if (datePickerRef.current) {
			datePickerRef.current.setOpen(false);
		}
	};

	const clearRange = () => {
		onChange([null, null]);
		setCurrentLabel("Pick a start date");
	};

	const startOfDay = (date) => {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		return d;
	};

	const endOfDay = (date) => {
		const d = new Date(date);
		d.setHours(23, 59, 59, 999);
		return d;
	};

	const startOfWeek = (date) => {
		const d = new Date(date);
		const day = d.getDay(); // 0 sunday
		const diff = d.getDate() - day;
		return startOfDay(new Date(d.setDate(diff)));
	};

	const endOfWeek = (date) => {
		const start = startOfWeek(date);
		const end = new Date(start);
		end.setDate(end.getDate() + 6);
		return endOfDay(end);
	};

	const buttonClassName =
		"cursor-pointer text-left hover:ring-base-content/50 hover:ring w-full p-1 hover:bg-primary/10";

	return (
		<div>
			<DatePicker
				ref={datePickerRef}
				startDate={startDate}
				endDate={endDate}
				// onChange={onChange}
				onChange={handleChange}
				selectsRange
				shouldCloseOnSelect={false}
				{...props}
			>
				<div className="text-left">
					<div className="mt-1 p-1 text-xs text-base-neutral text-blue-500">
						{getLabel()}
					</div>
					<button
						type="button"
						className={buttonClassName}
						onClick={() => setRange(new Date(now - 10 * 60 * 1000), now)}
					>
						Last 10 mins
					</button>
					<button
						type="button"
						className={buttonClassName}
						onClick={() => setRange(new Date(now - 30 * 60 * 1000), now)}
					>
						Last 30 mins
					</button>
					<button
						type="button"
						className={buttonClassName}
						onClick={() => setRange(new Date(now - 1 * 60 * 60 * 1000), now)}
					>
						Last 1 hour
					</button>
					<button
						type="button"
						className={buttonClassName}
						onClick={() => setRange(new Date(now - 5 * 60 * 60 * 1000), now)}
					>
						Last 5 hours
					</button>
					<button
						type="button"
						className={buttonClassName}
						onClick={() => setRange(new Date(now - 10 * 60 * 60 * 1000), now)}
					>
						Last 10 hours
					</button>
					<button
						type="button"
						className={buttonClassName}
						onClick={() => setRange(startOfDay(now), endOfDay(now))}
					>
						Today
					</button>
					<button
						type="button"
						className={buttonClassName}
						onClick={() => {
							const y = new Date();
							y.setDate(y.getDate() - 1);
							setRange(startOfDay(y), endOfDay(y));
						}}
					>
						Yesterday
					</button>
					<button
						type="button"
						className={buttonClassName}
						onClick={() => setRange(startOfWeek(now), endOfWeek(now))}
					>
						This week
					</button>
					<button
						type="button"
						className={buttonClassName}
						onClick={() => {
							const lastWeekStart = startOfWeek(
								new Date(now.setDate(now.getDate() - 7)),
							);
							const lastWeekEnd = endOfWeek(lastWeekStart);
							setRange(lastWeekStart, lastWeekEnd);
						}}
					>
						Last week
					</button>
					<button
						type="button"
						className={`${buttonClassName} text-red-600`}
						onClick={clearRange}
					>
						Clear filter
					</button>
				</div>
			</DatePicker>
		</div>
	);
};

export default SmartCalendarContainer;
