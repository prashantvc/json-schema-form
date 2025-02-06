import React, { useState } from "react";
import "./DrawCanvas.css"; // Import CSS for styling

function DrawCanvas({ value, onChange, title, description }) {
	const getColor = () => {
		return "#FF0000";
	};

	const [points, setPoints] = useState(value || []);
	const [drawings, setDrawings] = useState([]);
	const [currentColor, setCurrentColor] = useState(getColor());
	const canvasRef = React.useRef(null);
	const [drawing, setDrawing] = useState(false);
	const [highlight, setHighlight] = useState(false);
	const [selectedDrawingIndex, setSelectedDrawingIndex] = useState(null);

	React.useEffect(() => {
		if (!canvasRef.current) return;
		const ctx = canvasRef.current.getContext("2d");
		ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
		drawings.forEach((drawing, index) => {
			drawPoints(ctx, drawing.points, drawing.color, `ROI ${index + 1}`);
		});
		if (points.length > 0) {
			drawPoints(ctx, points, currentColor);
		}
	}, [points, drawings]);

	const drawPoints = (ctx, points, color, label) => {
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(points[0][0], points[0][1]);
		points.forEach(([x, y]) => ctx.lineTo(x, y));
		if (points.length >= 3 && isCloseToStart(points[points.length - 1], points[0])) {
			ctx.lineTo(points[0][0], points[0][1]); // Draw the closing line
		}
		ctx.stroke();
		points.forEach(([x, y]) => {
			ctx.beginPath();
			ctx.arc(x, y, 2, 0, 2 * Math.PI);
			ctx.fill();
		});
		if (label) {
			ctx.fillStyle = "#000";
			ctx.font = "12px Arial";
			const textWidth = ctx.measureText(label).width;
			const x = Math.min(points[0][0] + 5, canvasRef.current.width - textWidth - 5);
			const y = Math.max(points[0][1] - 5, 12);
			ctx.fillText(label, x, y);
		}
	};

	const handleMouseDown = (e) => {
		setDrawing(true);
		setHighlight(true);
		const rect = canvasRef.current.getBoundingClientRect();
		const newPoint = [e.clientX - rect.left, e.clientY - rect.top];
		if (points.length >= 3 && isCloseToStart(newPoint, points[0])) {
			setDrawings([...drawings, { points: [...points, points[0]], color: currentColor }]); // Close the polygon
			setPoints([]);
			setCurrentColor(getColor());
			onChange([]);
		} else if (points.length === 0 || !isCloseToPrevious(newPoint, points[points.length - 1])) {
			setPoints([...points, newPoint]);
		}

		const ctx = canvasRef.current.getContext("2d");
		ctx.beginPath();
		ctx.arc(newPoint[0], newPoint[1], 2, 0, 2 * Math.PI);
		ctx.fill();
	};

	const isCloseToStart = (point, start) => {
		const distance = Math.sqrt((point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2);
		return distance < 10; // Adjust the threshold as needed
	};

	const isCloseToPrevious = (point, previous) => {
		const distance = Math.sqrt((point[0] - previous[0]) ** 2 + (point[1] - previous[1]) ** 2);
		return distance < 10; // Adjust the threshold as needed
	};

	const handleMouseUp = () => {
		setDrawing(false);
		setHighlight(false);
		onChange(points);
	};

	const handleClear = () => {
		setPoints([]);
		setDrawings([]);
		onChange([]);
	};

	const handleRemoveDrawing = (index) => {
		const newDrawings = drawings.filter((_, i) => i !== index);
		setDrawings(newDrawings);
	};

	return (
		<div className="draw-canvas-container">
			<h3>{title}</h3>
			<p>{description}</p>
			<div className="canvas-and-listbox">
				<canvas
					ref={canvasRef}
					width={400}
					height={200}
					className="draw-canvas"
					onMouseDown={handleMouseDown}
					onMouseUp={handleMouseUp}
				/>
				<div className="drawings-listbox">
					<select
						size="10"
						className="form-control"
						style={{ width: "150px", height: "200px" }}
						onChange={(e) => setSelectedDrawingIndex(e.target.selectedIndex)}
					>
						{drawings.map((drawing, index) => (
							<option key={index}>
								Drawing {index + 1}: {drawing.points.length - 1} points
							</option>
						))}
					</select>
				</div>
			</div>
			<div className="controls">
				<button onClick={handleClear}>Clear</button>
				<button onClick={() => handleRemoveDrawing(selectedDrawingIndex)}>Remove Selected</button>
			</div>
		</div>
	);
}

export default DrawCanvas;
