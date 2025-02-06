import React, { useState } from "react";
import schema from "./schema";
import DrawCanvas from "./DrawCanvas"; // Import the DrawCanvas component

function getLocalizedText(obj, lang = "en") {
	if (!obj) return "";
	if (typeof obj === "string") return obj;
	return obj[lang] || Object.values(obj)[0] || "";
}

function validate(value, schemaProp) {
	if (schemaProp.type === "string") {
		if (schemaProp.minLength && value.length < schemaProp.minLength) {
			return `Minimum length is ${schemaProp.minLength}`;
		}
		if (schemaProp.maxLength && value.length > schemaProp.maxLength) {
			return `Maximum length is ${schemaProp.maxLength}`;
		}
	}
	return null;
}

function RenderProperty({ propName, schemaProp, value, onChange, lang }) {
	const title = getLocalizedText(schemaProp.title, lang);
	const description = getLocalizedText(schemaProp.description, lang);
	const [error, setError] = useState(null);

	const handleChange = (val) => {
		const validationError = validate(val, schemaProp);
		setError(validationError);
		onChange(val);
	};

	switch (schemaProp["x-ui-type"]) {
		case "text":
			return (
				<div className="form-group card">
					<label>{title}</label>
					<input
						type="text"
						value={value || ""}
						onChange={(e) => handleChange(e.target.value)}
						className="form-control"
					/>
					<p className="form-text">{description}</p>
					{error && <p className="form-error">{error}</p>}
				</div>
			);
		case "password":
			return (
				<div className="form-group card">
					<label>{title}</label>
					<input
						type="password"
						value={value || ""}
						onChange={(e) => handleChange(e.target.value)}
						className="form-control"
					/>
					<p className="form-text">{description}</p>
					{error && <p className="form-error">{error}</p>}
				</div>
			);
		case "list":
			return (
				<div className="form-group card">
					<label>{title}</label>
					{(value || []).map((item, index) => (
						<input
							key={index}
							type="text"
							value={item}
							onChange={(e) => {
								const newValue = [...value];
								newValue[index] = e.target.value;
								handleChange(newValue);
							}}
							className="form-control"
							style={{ marginBottom: "0.5em" }}
						/>
					))}
					<button
						type="button"
						className="btn btn-secondary"
						onClick={() => handleChange([...(value || []), ""])}
					>
						Add Color
					</button>
					<p className="form-text">{description}</p>
					{error && <p className="form-error">{error}</p>}
				</div>
			);
		case "draw":
			return (
				<div className="form-group card">
					<DrawCanvas value={value} onChange={handleChange} title={title} description={description} />
				</div>
			);
		case "checkbox":
			return (
				<div className="form-group form-check card">
					<input
						type="checkbox"
						checked={value || false}
						onChange={(e) => handleChange(e.target.checked)}
						className="form-check-input"
					/>
					<label className="form-check-label">{title}</label>
					<p className="form-text">{description}</p>
					{error && <p className="form-error">{error}</p>}
				</div>
			);
		default:
			return null;
	}
}

function FormRenderer({ schema, onSubmit, lang }) {
	const buildInitialData = React.useCallback((sch) => {
		if (!sch || sch.type !== "object" || !sch.properties) return {};
		const data = {};
		const props = sch.properties;
		for (let key of Object.keys(props)) {
			const prop = props[key];
			if (prop.default !== undefined) {
				data[key] = prop.default;
			} else if (prop.type === "object" && prop["x-ui-type"] === "group") {
				data[key] = buildInitialData(prop);
			} else if (prop.type === "array") {
				data[key] = prop.default || [];
			} else {
				data[key] = undefined;
			}
		}
		return data;
	}, []);

	const [formData, setFormData] = useState(() => buildInitialData(schema));
	const [searchTerm, setSearchTerm] = useState("");

	const handlePropertyChange = (propName, val) => {
		setFormData((prev) => ({
			...prev,
			[propName]: val,
		}));
	};

	const properties = schema.properties || {};
	const order = schema.propertyOrder || Object.keys(properties);

	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit(formData);
	};

	const filterProperties = (props, term) => {
		const filteredProps = {};
		for (let key of Object.keys(props)) {
			const prop = props[key];
			const title = getLocalizedText(prop.title, lang).toLowerCase();
			const description = getLocalizedText(prop.description, lang).toLowerCase();
			if (title.includes(term.toLowerCase()) || description.includes(term.toLowerCase())) {
				filteredProps[key] = prop;
			} else if (prop.type === "object" && prop["x-ui-type"] === "group") {
				const nestedFilteredProps = filterProperties(prop.properties, term);
				if (Object.keys(nestedFilteredProps).length > 0) {
					filteredProps[key] = { ...prop, properties: nestedFilteredProps };
				}
			}
		}
		return filteredProps;
	};

	const filteredProperties = filterProperties(properties, searchTerm);

	return (
		<form onSubmit={handleSubmit}>
			<div style={{ marginBottom: "1em" }}>
				<input
					type="text"
					placeholder="Filter fields"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="form-control"
				/>
			</div>
			{Object.keys(filteredProperties).map((key) => {
				const prop = filteredProperties[key];
				if (prop.type === "object" && prop["x-ui-type"] === "group") {
					return (
						<div key={key} className="card">
							<h3>{getLocalizedText(prop.title, lang)}</h3>
							<p>{getLocalizedText(prop.description, lang)}</p>
							{Object.keys(prop.properties).map((subKey) => (
								<RenderProperty
									key={subKey}
									propName={subKey}
									schemaProp={prop.properties[subKey]}
									value={formData[key]?.[subKey]}
									onChange={(val) =>
										handlePropertyChange(key, {
											...formData[key],
											[subKey]: val,
										})
									}
									lang={lang}
								/>
							))}
						</div>
					);
				}
				return (
					<RenderProperty
						key={key}
						propName={key}
						schemaProp={prop}
						value={formData[key]}
						onChange={(val) => handlePropertyChange(key, val)}
						lang={lang}
					/>
				);
			})}
			<button type="submit" className="btn btn-primary">
				Submit
			</button>
		</form>
	);
}

function App() {
	const [lang, setLang] = useState("en");

	const toggleLanguage = () => {
		setLang((prevLang) => (prevLang === "en" ? "ja" : "en"));
	};

	return (
		<div className="container">
			<div style={{ textAlign: "right", padding: "1em" }}>
				<button onClick={toggleLanguage} className="btn btn-primary">
					{lang === "en" ? "English" : "Japanese"}
				</button>
			</div>
			<FormRenderer schema={schema} onSubmit={(data) => console.log(data)} lang={lang} />
		</div>
	);
}

export default App;
