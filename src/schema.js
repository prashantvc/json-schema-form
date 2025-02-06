const schema = {
	$schema: "https://awl.co.jp/schema/v1/setting_schema.json",
	type: "object",
	propertyOrder: ["loginCredentials", "colors", "signature", "rememberMe"],
	properties: {
		loginCredentials: {
			title: { en: "Login Credentials", ja: "ログイン情報" },
			description: { en: "Please enter user credentials", ja: "ユーザー情報を入力してください" },
			type: "object",
			"x-ui-type": "group",
			properties: {
				username: {
					title: { en: "Username", ja: "ユーザー名" },
					type: "string",
					"x-ui-type": "text",
					default: "",
					minLength: 3,
					maxLength: 8,
				},
				password: {
					title: { en: "Password", ja: "パスワード" },
					type: "string",
					"x-ui-type": "password",
				},
			},
		},
		colors: {
			title: { en: "Favorite Colors", ja: "好きな色" },
			description: { en: "Pick some colors you like", ja: "好きな色を選んでください" },
			type: "array",
			"x-ui-type": "list",
			items: {
				type: "string",
			},
		},
		roi: {
			title: { en: "Region of Interest", ja: "関心のある地域" },
			description: { en: "Draw ROI", ja: "関心領域の描画" },
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
			title: { en: "Remember Me", ja: "私を覚えてますか" },
			type: "boolean",
			"x-ui-type": "checkbox",
			default: false,
		},
	},
	required: ["loginCredentials"],
};

export default schema;
