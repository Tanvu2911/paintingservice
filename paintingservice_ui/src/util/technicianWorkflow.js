/**
 * Helper to determine workflow state & permissions for a technician in a booking.
 * In a multi-service booking, multiple worker teams can be assigned to different service items.
 * Each worker team must have an independent workflow:
 * ASSIGNED (Chờ nhận) -> ACCEPTED (Đã nhận / Chờ thi công) -> PROCESSING (Đang làm) -> WORKER_COMPLETED (Đã báo hoàn thành)
 */
export function getTechWorkflowState(job, currentUser) {
  if (!job) {
    return {
      myStatus: "",
      canAccept: false,
      canReject: false,
      canStart: false,
      canComplete: false,
      isWaitingAcceptance: false,
      isDone: false,
      isCancelled: false,
      myItems: [],
    };
  }

  const status = job.status || "";
  const isFinalDone = ["WAITING_FINAL_PAYMENT", "COMPLETED", "PAID_TO_STAFF"].includes(status);
  const isCancelled = status === "CANCELLED" || status === "WORKER_REJECTED";

  // Check matching items assigned to this technician
  const items = job.bookingServices || [];
  const myItems = items.filter((bs) => {
    if (currentUser?.username && bs.technicianName?.toLowerCase() === currentUser.username.toLowerCase()) {
      return true;
    }
    if (currentUser?.id && bs.technicianId && String(bs.technicianId) === String(currentUser.id)) {
      return true;
    }
    // Fallback if item has no technician assigned but job-level technician matches
    if (!bs.technicianId && job.technicianName && currentUser?.username && job.technicianName.toLowerCase() === currentUser.username.toLowerCase()) {
      return true;
    }
    return false;
  });

  if (myItems.length > 0) {
    const allMyAccepted = myItems.every((i) => i.technicianAccepted);
    const anyMyStarted = myItems.some((i) => i.technicianStarted);
    const allMyCompleted = myItems.every((i) => i.technicianCompleted);

    let myStatus = status;
    let canAccept = false;
    let canReject = false;
    let canStart = false;
    let canComplete = false;
    let isWaitingAcceptance = false;

    if (isFinalDone) {
      myStatus = status;
    } else if (isCancelled) {
      myStatus = status;
    } else if (allMyCompleted) {
      myStatus = "WORKER_COMPLETED";
      isWaitingAcceptance = true;
    } else if (anyMyStarted) {
      myStatus = "PROCESSING";
      canComplete = true;
    } else if (allMyAccepted) {
      myStatus = "ACCEPTED";
      canStart = true;
      canReject = true;
    } else {
      // Not yet accepted by this team, regardless of whether other teams have started
      myStatus = "ASSIGNED";
      canAccept = true;
      canReject = true;
    }

    return {
      myStatus,
      canAccept,
      canReject,
      canStart,
      canComplete,
      isWaitingAcceptance,
      isDone: isFinalDone,
      isCancelled,
      myItems,
    };
  }

  // Fallback for bookings without items or legacy single-service bookings
  const canAccept = ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED"].includes(status);
  const canReject = ["CONTRACT_APPROVED", "DEPOSIT_CONFIRMED", "ASSIGNED", "ACCEPTED"].includes(status);
  const canStart = status === "ACCEPTED";
  const canComplete = status === "PROCESSING";
  const isWaitingAcceptance = status === "WORKER_COMPLETED";

  return {
    myStatus: status,
    canAccept,
    canReject,
    canStart,
    canComplete,
    isWaitingAcceptance,
    isDone: isFinalDone,
    isCancelled,
    myItems: [],
  };
}
