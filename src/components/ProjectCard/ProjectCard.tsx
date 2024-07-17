import { Portfolio } from "../../common/common.types";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./ProjectCard.css";

export default function ProjectCard({
	style,
	color,
	type,
	stack,
	title,
	description,
	deploy,
	buttonCSS,
	link,
	platform,
	isLoading,
}: Portfolio & {
	isLoading: boolean;
}) {
	return (
		<div
			className="card-container"
			style={style}>
			<div className="card-project-type-stack">
				{isLoading ? (
					<Skeleton />
				) : (
					<span
						className="card-project-type"
						style={color}>
						{type}
					</span>
				)}

				<span className="card-project-stack">
					{isLoading ? <Skeleton /> : stack}
				</span>
			</div>

			<h2 className="card-project-title">{isLoading ? <Skeleton /> : title}</h2>

			<p className="card-project-description">
				{isLoading ? <Skeleton count={3} /> : description}
			</p>

			<div className="link-buttons">
				<div className="card-project-link">
					{isLoading ? (
						<Skeleton count={1} />
					) : (
						<a
							href={deploy}
							style={buttonCSS}
							target="_blank"
							rel="noopener noreferrer">
							Live Project
						</a>
					)}
				</div>
				<div className="card-project-link">
					{isLoading ? (
						<Skeleton />
					) : (
						<a
							href={link}
							style={buttonCSS}
							target="_blank"
							rel="noopener noreferrer">
							{platform}
						</a>
					)}
				</div>
			</div>
		</div>
	);
}
