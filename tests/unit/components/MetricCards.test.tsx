import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCards } from "@/components/dashboard/MetricCards";

describe("MetricCards", () => {
  it("renders all four metric cards", () => {
    render(<MetricCards />);
    expect(screen.getByText("Total Views")).toBeInTheDocument();
    expect(screen.getByText("Total Likes")).toBeInTheDocument();
    expect(screen.getByText("Follower Growth")).toBeInTheDocument();
    expect(screen.getByText("Est. GMV")).toBeInTheDocument();
  });

  it("displays formatted view count", () => {
    render(<MetricCards />);
    // 12450 → 12.5K
    expect(screen.getByText("12.4K")).toBeInTheDocument();
  });

  it("displays formatted GMV as currency", () => {
    render(<MetricCards />);
    expect(screen.getByText("$1,840")).toBeInTheDocument();
  });

  it("shows positive delta indicators", () => {
    render(<MetricCards />);
    // All mock deltas are positive
    const deltas = screen.getAllByText(/vs last week/);
    expect(deltas.length).toBe(4);
    deltas.forEach((el) => {
      expect(el.textContent).toMatch(/^\+/);
    });
  });
});
