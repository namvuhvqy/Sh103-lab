import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TasksFeedback } from "@/components/forms/TasksFeedback";

describe("Tasks mutation feedback", () => {
  it("renders N/A mutation errors as an accessible alert", () => {
    render(<TasksFeedback error="Lý do Không áp dụng là bắt buộc" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Lý do Không áp dụng là bắt buộc");
  });

  it("renders successful N/A mutations as status feedback", () => {
    render(<TasksFeedback saved="na" />);
    expect(screen.getByRole("status")).toHaveTextContent("Đã đánh dấu Không áp dụng");
  });
});
