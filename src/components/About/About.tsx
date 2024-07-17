import "./About.css";
import Education from "../Education/Education";
import Skills from "../Skills/Skills";

function About() {
	return (
		<div className="about">
			<div className="bio-img-text-container">
				<img
					className="bio-img"
					src="https://media.licdn.com/dms/image/C4D03AQEaQ6R3Cru90A/profile-displayphoto-shrink_400_400/0/1656224199855?e=1726704000&v=beta&t=ucxNr_7ZU5QgAbe52abjMCx2QeoDJI3CaDLydAeHdkM"
					alt="profile pic"
				/>
				<div className="bio-container">
					<h2 className="bio-heading">Hi, I&apos;m Harshit Kr Vishwakarma.</h2>
					<p>
						Currently working as{" "}
						<span className="active-tab">Associate Software Engineer</span> at{" "}
						<a
							className="genesys"
							target="_blank"
							href="https://www.linkedin.com/company/genesys/mycompany/verification/"
							rel="noopener noreferrer">
							Genesys
						</a>
						, completed my Master&apos;s of Computer Application from{" "}
						<span className="vit-vellore">VIT Vellore</span> with{" "}
						<span className="active-tab">9.1 CGPA</span>. I have a strong
						passion for full-stack web development.{" "}
					</p>
					<p>
						I also have experience in creating decentralized application on
						Blockchain aka web3.
					</p>
				</div>
			</div>
			<div className="">
				<Skills />
				<Education />
			</div>
		</div>
	);
}

export default About;
