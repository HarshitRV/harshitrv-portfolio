import { createBrowserRouter } from "react-router-dom";
import "./App.css";
import Projects from "./components//Projects/Projects";

import Root from "./routes/root";
import Index from "./components/Index/Index";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const router = createBrowserRouter([
	{
		path: "/",
		element: <Root />,
		errorElement: <>Something went wrong</>,
		children: [
			{
				index: true,
				element: <Index />,
			},
			{
				path: "portfolio",
				// loader: projectLoader,
				element: <Projects />,
			},
		],
	},
]);

const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	);
};

export default App;
