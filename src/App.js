import React, { useState } from "react";

// ----- Example schema (from above) -----
const schema = {
	$schema: "https://awl.co.jp/schema/v1/setting_schema.json",
	type: "object",
	propertyOrder: ["loginCredentials", "colors", "signature", "rememberMe"],
	properties: {
		loginCredentials: {
			title: { en: "Login Credentials" },
			description: { en: "Please enter user credentials" },
			type: "object",
			"x-ui-type": "group",
			properties: {
				username: {
					title: { en: "Username" },
					type: "string",
					"x-ui-type": "text",
					default: "",
				},
				password: {
					title: { en: "Password" },
					type: "string",
					"x-ui-type": "password",
				},
			},
		},
		colors: {
			title: { en: "Favorite Colors" },
			description: { en: "Pick some colors you like" },
			type: "array",
			"x-ui-type": "list",
			items: {
				type: "string",
			},
		},
		signature: {
			title: { en: "Signature" },
			description: { en: "Draw your signature below" },
			type: "array",
			"x-ui-type": "draw",
			items: {
				type: "array",
				items: { type: "number" },
				minItems: 2,
				maxItems: 2,
			},
		},
		rememberMe: {
			title: { en: "Remember Me" },
			type: "boolean",
			"x-ui-type": "checkbox",
			default: false,
		},
	},
	required: ["loginCredentials"],
};

// ----- A small helper to get the localized string (assuming 'en' fallback) -----
function getLocalizedText(obj, lang = "en") {
	if (!obj) return "";
	if (typeof obj === "string") return obj;
	return obj[lang] || Object.values(obj)[0] || "";
}

// ----- Canvas for "draw" type -----
function DrawCanvas({ value, onChange, title, description }) {
	const [points, setPoints] = useState(value || []);

	const canvasRef = React.useRef(null);
	const [drawing, setDrawing] = useState(false);

	// Draw the existing points whenever 'points' changes
	React.useEffect(() => {
		if (!canvasRef.current) return;
		const ctx = canvasRef.current.getContext("2d");
		// Clear
		ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
		// Redraw
		if (points.length > 0) {
			ctx.beginPath();
			ctx.moveTo(points[0][0], points[0][1]);
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i][0], points[i][1]);
			}
			ctx.stroke();
			ctx.closePath();
		}
	}, [points]);

	// Helper to get mouse position
	const getPos = (e) => {
		const rect = canvasRef.current.getBoundingClientRect();
		return [e.clientX - rect.left, e.clientY - rect.top];
	};

	const startDrawing = (e) => {
		setDrawing(true);
		const newPoint = getPos(e);
		setPoints((prev) => [...prev, newPoint]);
	};

	const draw = (e) => {
		if (!drawing) return;
		const newPoint = getPos(e);
		setPoints((prev) => [...prev, newPoint]);
	};

	const stopDrawing = () => {
		setDrawing(false);
		// Send updated points back to parent
		onChange(points);
	};

	const clear = () => {
		setPoints([]);
		onChange([]);
	};

	return (
		<div style={{ marginBottom: "1em" }}>
			<label style={{ fontWeight: "bold" }}>{title}</label>
			<div style={{ fontSize: "smaller", marginBottom: "0.5em" }}>{description}</div>

			<canvas
				ref={canvasRef}
				width={400}
				height={200}
				style={{ border: "1px solid #ccc" }}
				onMouseDown={startDrawing}
				onMouseMove={draw}
				onMouseUp={stopDrawing}
				onMouseLeave={stopDrawing}
			/>
			<div style={{ marginTop: "0.5em" }}>
				<button type="button" onClick={clear}>
					Clear
				</button>
			</div>
		</div>
	);
}

// ----- Renderer for a single property -----
function RenderProperty({ propName, schemaProp, value, onChange }) {
	const title = getLocalizedText(schemaProp.title, "en");
	const description = getLocalizedText(schemaProp.description, "en");
	const xUiType = schemaProp["x-ui-type"];
	const type = schemaProp.type;

	// Handle "group" (object)
	if (xUiType === "group" && type === "object") {
		// Recursively render sub-properties
		const properties = schemaProp.properties || {};
		const propertyOrder = schemaProp.propertyOrder || Object.keys(properties);
		return (
			<fieldset style={{ marginBottom: "1em" }}>
				<legend style={{ fontWeight: "bold" }}>{title}</legend>
				{description && <div style={{ fontSize: "smaller", marginBottom: "0.5em" }}>{description}</div>}
				{propertyOrder.map((subKey) => (
					<RenderProperty
						key={subKey}
						propName={subKey}
						schemaProp={properties[subKey]}
						value={value[subKey]}
						onChange={(val) => {
							onChange({
								...value,
								[subKey]: val,
							});
						}}
					/>
				))}
			</fieldset>
		);
	}

	// Handle "text" or "textarea" or "password" (string)
	if ((xUiType === "text" || xUiType === "textarea" || xUiType === "password") && type === "string") {
		const isTextArea = xUiType === "textarea";
		const inputType = xUiType === "password" ? "password" : "text";

		return (
			<div style={{ marginBottom: "1em" }}>
				<label style={{ display: "block", fontWeight: "bold" }}>{title}</label>
				{description && <div style={{ fontSize: "smaller", marginBottom: "0.25em" }}>{description}</div>}
				{isTextArea ? (
					<textarea
						value={value || ""}
						onChange={(e) => onChange(e.target.value)}
						rows={4}
						style={{ width: "100%", maxWidth: "400px" }}
					/>
				) : (
					<input
						type={inputType}
						value={value || ""}
						onChange={(e) => onChange(e.target.value)}
						style={{ width: "100%", maxWidth: "400px" }}
					/>
				)}
			</div>
		);
	}

	// Handle "checkbox" (boolean)
	if (xUiType === "checkbox" && type === "boolean") {
		return (
			<div style={{ marginBottom: "1em" }}>
				<label>
					<input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {title}
				</label>
				{description && <div style={{ fontSize: "smaller" }}>{description}</div>}
			</div>
		);
	}

	// Handle "list" (array of simple type)
	if (xUiType === "list" && type === "array") {
		const items = value || [];
		return (
			<div style={{ marginBottom: "1em" }}>
				<label style={{ fontWeight: "bold" }}>{title}</label>
				{description && <div style={{ fontSize: "smaller", marginBottom: "0.25em" }}>{description}</div>}
				{items.map((itemVal, idx) => (
					<div key={idx} style={{ marginBottom: "0.25em" }}>
						<input
							type="text"
							value={itemVal}
							onChange={(e) => {
								const newItems = [...items];
								newItems[idx] = e.target.value;
								onChange(newItems);
							}}
							style={{ width: "300px" }}
						/>
						<button
							type="button"
							onClick={() => {
								const newItems = items.filter((_, i) => i !== idx);
								onChange(newItems);
							}}
							style={{ marginLeft: "5px" }}
						>
							Remove
						</button>
					</div>
				))}
				<button type="button" onClick={() => onChange([...items, ""])}>
					Add Item
				</button>
			</div>
		);
	}

	// Handle "draw" (array of [x,y] coordinates)
	if (xUiType === "draw" && type === "array") {
		return (
			<DrawCanvas
				title={title}
				description={description}
				value={value}
				onChange={(newPoints) => onChange(newPoints)}
			/>
		);
	}

	// If no known type, just render a placeholder
	return (
		<div style={{ marginBottom: "1em", color: "red" }}>
			<strong>Unsupported field:</strong> {propName} ({xUiType}, {type})
		</div>
	);
}

// ----- Main Form component -----
function FormRenderer({ schema, onSubmit }) {
	// Initialize formData with defaults, if present.
	// We'll do a quick "walk" of the schema to gather default values.
	const buildInitialData = React.useCallback((sch) => {
		if (!sch || sch.type !== "object" || !sch.properties) return {};
		const data = {};
		const props = sch.properties;
		for (let key of Object.keys(props)) {
			const prop = props[key];
			if (prop.default !== undefined) {
				data[key] = prop.default;
			} else if (prop.type === "object" && prop["x-ui-type"] === "group") {
				// Recursively fill child defaults
				data[key] = buildInitialData(prop);
			} else if (prop.type === "array") {
				// If there's a default array, use it; otherwise empty
				data[key] = prop.default || [];
			} else {
				data[key] = undefined;
			}
		}
		return data;
	}, []);

	const [formData, setFormData] = useState(() => buildInitialData(schema));

	// Because the user might add items in lists or draw on canvas,
	// we'll store everything dynamically in the state.

	// A helper function to handle top-level property changes
	const handlePropertyChange = (propName, val) => {
		setFormData((prev) => ({
			...prev,
			[propName]: val,
		}));
	};

	// Render all top-level properties in order
	const properties = schema.properties || {};
	const order = schema.propertyOrder || Object.keys(properties);

	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit}>
			{order.map((key) => (
				<RenderProperty
					key={key}
					propName={key}
					schemaProp={properties[key]}
					value={formData[key]}
					onChange={(val) => handlePropertyChange(key, val)}
				/>
			))}

			<button type="submit">Submit</button>
		</form>
	);
}

// ----- App root: usage example -----
function App() {
	const handleFormSubmit = (data) => {
		console.log("Form submitted with data:", data);
		alert("Check the console for submitted data!");
	};

	return (
		<div style={{ margin: "2em" }}>
			<h1>JSON Schema Form Example</h1>
			<FormRenderer schema={schema} onSubmit={handleFormSubmit} />
		</div>
	);
}

export default App;
