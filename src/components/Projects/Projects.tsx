import { useQuery } from "@tanstack/react-query";
import defaultData from "../../../data.json";
import { PortfolioData } from "../../common/common.types";
import ProjectCard from "../ProjectCard/ProjectCard";
import "./Projects.css";

export default function Projects() {
	const { isSuccess, isLoading, data } = useQuery({
		queryKey: ["projects"],
		queryFn: async (): Promise<PortfolioData> => {
			const response = await fetch(
				"https://api.jsonbin.io/v3/b/66976174acd3cb34a86743d3/latest"
			);

			if (!response.ok) {
				const { errorMessage } = await response.json();
				throw new Error(errorMessage);
			}

			await new Promise((resolve) => setTimeout(resolve, 800));

			const data = await response.json();

			return data.record;
		},
	});

	const projectsData: PortfolioData = isSuccess ? data : defaultData;
	const projectElement = projectsData.portfolio.map((project, index) => {
		return (
			<div key={index}>
				<ProjectCard
					{...project}
					isLoading={isLoading}
				/>
			</div>
		);
	});
	return <div className="projects">{projectElement}</div>;
}
