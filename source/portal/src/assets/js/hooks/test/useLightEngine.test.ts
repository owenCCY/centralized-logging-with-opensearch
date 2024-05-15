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

import { renderHook } from "@testing-library/react";
import { useDispatch } from "react-redux";
import { useLightEngine } from "../useLightEngine";

// Mock useDispatch and useSelector
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

describe("useLightEngine hook", () => {
  let mockDispatch = jest.fn();

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useDispatch as any).mockReturnValue(mockDispatch);
  });

  it("should call initStatus action on unmount", () => {
    const { unmount } = renderHook(() => useLightEngine());

    unmount();

    expect(mockDispatch).toHaveBeenCalledWith({
      payload: undefined,
      type: "CLEAR_LIGHT_ENGINE",
    });
  });
});
