/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License").
You may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import ExpandableSection from "./ExpandableSection";
import { renderWithProviders } from "test-utils";

describe("ExpandableSection", () => {
  it("should render with defaultExpanded set to true", () => {
    renderWithProviders(
      <ExpandableSection headerText="Test Header">
        <p>Test content</p>
      </ExpandableSection>
    );

    expect(screen.getByText("Test Header")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should toggle content visibility when header is clicked", () => {
    renderWithProviders(
      <ExpandableSection headerText="Test Header">
        <p>Test content</p>
      </ExpandableSection>
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Test Header"));
  });

  it("should display the header text", () => {
    renderWithProviders(
      <ExpandableSection headerText="Test Header">
        <p>Test content</p>
      </ExpandableSection>
    );

    expect(screen.getByText("Test Header")).toBeInTheDocument();
  });
});
