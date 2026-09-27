import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import WarningsPage from "./page";

describe("WarningsPage", () => {
  it("renders the warnings heading", () => {
    render(<WarningsPage />);
    expect(screen.getByRole("heading", { name: /warnings/i })).toBeInTheDocument();
  });
});
