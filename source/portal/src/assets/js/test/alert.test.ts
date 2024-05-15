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
import Swal from "sweetalert2";
import { refineErrorMessage } from "../request";
import { ErrorCode } from "API";
import { handleErrorMessage } from "../alert";

// Mock the necessary modules
jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));
jest.mock("../request", () => ({
  refineErrorMessage: jest.fn(),
}));
jest.mock("i18next", () => ({
  t: jest.fn((key) => key),
}));

describe("handleErrorMessage", () => {
  // Test for a specific error code
  it("should handle SVC_PIPELINE_NOT_CLEANED error", () => {
    // Set up the mock implementation for refineErrorMessage
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.SVC_PIPELINE_NOT_CLEANED,
      message: "Some error message",
    });
    // Call your function
    handleErrorMessage("Some error message");

    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith(
      "Ingestion pipeline exists…",
      "",
      "error"
    );
  });

  it("should handle UNSUPPORTED_ACTION_HAS_INGESTION error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.UNSUPPORTED_ACTION_HAS_INGESTION,
      message: "",
    });
    // Call your function
    handleErrorMessage("applog:deletePipeline.alarm");
    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith("Oops...", "", "error");
  });

  it("should handle UNSUPPORTED_ACTION_SOURCE_HAS_INGESTION error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.UNSUPPORTED_ACTION_SOURCE_HAS_INGESTION,
      message: "",
    });
    // Call your function
    handleErrorMessage("applog:logSourceDesc.eks.deleteAlarm1");
    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith("Oops...", "", "error");
  });

  it("should handle ASSOCIATED_STACK_UNDER_PROCESSING error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.ASSOCIATED_STACK_UNDER_PROCESSING,
      message: "",
    });
    // Call your function
    handleErrorMessage("cluster:domain.removeErrorSubstackUnderProcessing");
    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith("Oops...", "", "error");
  });

  it("should handle UPDATE_CWL_ROLE_FAILED error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.UPDATE_CWL_ROLE_FAILED,
      message: "",
    });
    // Call your function
    handleErrorMessage("resource:crossAccount.link.updateCwlRoleFailed");
    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith("Oops...", "", "error");
  });

  it("should handle ASSUME_ROLE_CHECK_FAILED error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.ASSUME_ROLE_CHECK_FAILED,
      message: "",
    });
    // Call your function
    handleErrorMessage("applog:logSourceDesc.eks.roleCheckFailed");
    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith("Oops...", "", "error");
  });

  it("should handle ACCOUNT_NOT_FOUND error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.ACCOUNT_NOT_FOUND,
      message: "",
    });
    // Call your function
    handleErrorMessage("resource:crossAccount.link.accountNotFound");
    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith("Oops...", "", "error");
  });

  it("should handle ACCOUNT_ALREADY_EXISTS error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.ACCOUNT_ALREADY_EXISTS,
      message: "",
    });
    // Call your function
    handleErrorMessage("resource:crossAccount.link.accountAlreadyExists");
    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith("Oops...", "", "error");
  });

  it("should handle ITEM_NOT_FOUND error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.ITEM_NOT_FOUND,
      message: "",
    });
    // Call your function
    handleErrorMessage("common:error.notFound");
    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith("Oops...", "undefined", "error");
  });

  it("should handle UNKNOWN_ERROR error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: ErrorCode.UNKNOWN_ERROR,
      message: "",
    });
    // Call your function
    handleErrorMessage("common:error.unknownError");
    // Assert Swal.fire was called with the correct arguments
    expect(Swal.fire).toHaveBeenCalledWith("Oops...", "undefined", "error");
  });

  // Test the default case
  it("should handle an unknown error", () => {
    (refineErrorMessage as any).mockReturnValue({
      errorCode: "UNKNOWN_CODE",
      message: "",
    });
    handleErrorMessage("");
    // Assert Swal.fire was not called for an unknown error
    expect(Swal.fire).not.toHaveBeenCalled();
  });
});
