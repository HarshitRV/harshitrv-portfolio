import { Outlet, NavLink } from "react-router-dom";
import Header from "../components/Header/Header";

export default function Root() {
	return (
		<div className="App">
			<Header />
			<section className="main-section">
				<h2 className="tabs">
					<NavLink
						className={({ isActive }) => (isActive ? "active-tab " : "tab")}
						to="/">
						Home
					</NavLink>

					<NavLink
						className={({ isActive }) => (isActive ? "active-tab " : "tab")}
						to="/portfolio">
						Portfolio
					</NavLink>
				</h2>
			</section>
			<Outlet />
		</div>
	);
}
