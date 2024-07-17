import { PortfolioData } from "../../common/common.types";

async function projectLoader(): Promise<{
	isSuccess: boolean;
	data: PortfolioData | null;
}> {
	try {
		const res = await fetch(
			"https://api.jsonbin.io/v3/b/66976174acd3cb34a86743d3/latest"
		);

		if (!res.ok) {
			const { errorMessage } = await res.json();
			throw new Error(errorMessage);
		}

		const data = await res.json();
		return { isSuccess: true, data: data.record };
	} catch (e) {
		console.log("failed to load projects data", e);
		console.log("fallback to default data");
		return { isSuccess: false, data: null };
	}
}

export default projectLoader;
