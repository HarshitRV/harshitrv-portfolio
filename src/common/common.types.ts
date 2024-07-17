export type Portfolio = {
	type: string;
	stack: string;
	title: string;
	description: string;
	platform: string;
	link: string;
	deploy: string;
	style: {
		border: string;
	};
	color: {
		color: string;
	};
	buttonCSS: {
		border: string;
	};
};

export type Education = {
	school: string;
	degree: string;
	duration: string;
	institute: string;
};

export type Experience = {
	company: string;
	role: string;
	duration: string;
	location: string;
	logo: string;
	link: string;
	color: {
		color: string;
	};
	buttonCSS: {
		border: string;
	};
};

export type PortfolioData = {
	portfolio: Portfolio[];
	education: Education[];
	experience: Experience[];
};
