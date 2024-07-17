import { Link } from "react-router-dom";
import "./Header.css";

export default function Header() {
	return (
		<>
			<div className="Header">
				<div className="name">
					<div className="logo-container">
						<Link to="/">
							<h3 className="logo">harshitRV</h3>
						</Link>
					</div>
				</div>
				<div className="links">
					<div className="icons">
						<div>
							<a
								href="https://github.com/harshitrv"
								target="_blank">
								<i className="bi bi-github"></i>
							</a>
						</div>
						<div>
							<a
								href="https://twitter.com/hrv_vishwakarma"
								target="_blank">
								<i className="bi bi-twitter"></i>
							</a>
						</div>
						<div>
							<a
								href="https://www.linkedin.com/in/harshitrv"
								target="_blank">
								<i className="bi bi-linkedin"></i>
							</a>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
