async function fetchBranchDetails() {
  const ifscInput = document.getElementById("ifsc");
  const branchInput = document.getElementById("branch");
  const ifscCode = ifscInput.value.trim().toUpperCase();

  if (ifscCode.length < 5) {
    branchInput.value = "";
    return;
  }

  try {
    const res = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
    if (!res.ok) throw new Error("Invalid IFSC");
    const data = await res.json();
    branchInput.value = `${data.BRANCH}, ${data.CITY}`;
  } catch {
    branchInput.value = "Invalid IFSC or not found";
  }
}