$ErrorActionPreference = "Stop"

$base = "http://localhost:3000/api"

function Invoke-JsonSafe {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body,
    [Microsoft.PowerShell.Commands.WebRequestSession]$Session
  )
  try {
    $json = $Body | ConvertTo-Json -Depth 6
    return Invoke-RestMethod -Method $Method -Uri $Url -WebSession $Session -ContentType "application/json" -Body $json
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $bodyText = $reader.ReadToEnd()
      Write-Output "ERROR $($resp.StatusCode) $($resp.StatusDescription) at $Url"
      if ($bodyText) { Write-Output $bodyText }
    } else {
      Write-Output "ERROR at ${Url}: $($_.Exception.Message)"
    }
    return $null
  }
}

function Patch-JsonSafe {
  param(
    [string]$Url,
    [object]$Body,
    [Microsoft.PowerShell.Commands.WebRequestSession]$Session
  )
  try {
    $json = $Body | ConvertTo-Json -Depth 6
    return Invoke-RestMethod -Method "PATCH" -Uri $Url -WebSession $Session -ContentType "application/json" -Body $json
  } catch {
    $resp = $_.Exception.Response
    if ($resp -and [int]$resp.StatusCode -eq 308) {
      $location = $resp.Headers["Location"]
      if ($location) {
        $json = $Body | ConvertTo-Json -Depth 6
        return Invoke-RestMethod -Method "PATCH" -Uri $location -WebSession $Session -ContentType "application/json" -Body $json
      }
    }
    if ($resp) {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $bodyText = $reader.ReadToEnd()
      Write-Output "ERROR $($resp.StatusCode) $($resp.StatusDescription) at $Url"
      if ($bodyText) { Write-Output $bodyText }
    } else {
      Write-Output "ERROR at ${Url}: $($_.Exception.Message)"
    }
    return $null
  }
}

$buyerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$sellerSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$buyerUser = @{ name = "Nexus Enterprise Pvt Ltd"; email = "demo.enterprise@example.com"; password = "Demo@1234"; userType = "Buyer"; dpdpConsent = $true }
$sellerUser = @{ name = "Nova MSME Suppliers"; email = "demo.msme@example.com"; password = "Demo@1234"; userType = "Seller"; dpdpConsent = $true }

Invoke-JsonSafe -Method "POST" -Url "$base/register" -Body $buyerUser -Session $buyerSession | Out-Null
Invoke-JsonSafe -Method "POST" -Url "$base/register" -Body $sellerUser -Session $sellerSession | Out-Null
Invoke-JsonSafe -Method "POST" -Url "$base/login" -Body @{ email = $buyerUser.email; password = $buyerUser.password } -Session $buyerSession | Out-Null
Invoke-JsonSafe -Method "POST" -Url "$base/login" -Body @{ email = $sellerUser.email; password = $sellerUser.password } -Session $sellerSession | Out-Null

$sellersResponse = Invoke-RestMethod -Method "GET" -Uri "$base/sellers" -WebSession $buyerSession
$sellersList = $sellersResponse.data.sellers
if (-not $sellersList) { $sellersList = $sellersResponse.sellers }
$msmeSeller = $sellersList | Where-Object { $_.email -eq $sellerUser.email } | Select-Object -First 1
if (-not $msmeSeller) { throw "MSME seller not found in /sellers." }

$posResponse = Invoke-RestMethod -Method "GET" -Uri "$base/purchase-orders" -WebSession $buyerSession
$poList = $posResponse.data.purchaseOrders
if (-not $poList) { $poList = $posResponse.purchaseOrders }

function Get-Or-CreatePo {
  param([string]$PoNumber, [hashtable]$Body)
  $existing = $poList | Where-Object { $_.poNumber -eq $PoNumber } | Select-Object -First 1
  if ($existing) { return $existing }
  $resp = Invoke-JsonSafe -Method "POST" -Url "$base/purchase-orders" -Body $Body -Session $buyerSession
  return $resp.data.purchaseOrder
}

$po1Body = @{
  poNumber = "PO-ENT-101";
  sellerId = $msmeSeller._id;
  totalAmount = 180000;
  notes = "Quarterly packaging supplies";
  lineItems = @(
    @{ description = "Corrugated boxes"; hsnCode = "481910"; quantity = 600; unitPrice = 180; total = 108000 },
    @{ description = "Thermal labels"; hsnCode = "482110"; quantity = 900; unitPrice = 80; total = 72000 }
  );
}
$po1 = Get-Or-CreatePo -PoNumber "PO-ENT-101" -Body $po1Body

$po2Body = @{
  poNumber = "PO-ENT-102";
  sellerId = $msmeSeller._id;
  totalAmount = 75000;
  notes = "Safety kits for plant floor";
  lineItems = @(
    @{ description = "Safety gloves"; hsnCode = "611610"; quantity = 500; unitPrice = 90; total = 45000 },
    @{ description = "Safety goggles"; hsnCode = "900490"; quantity = 250; unitPrice = 120; total = 30000 }
  );
}
$po2 = Get-Or-CreatePo -PoNumber "PO-ENT-102" -Body $po2Body

if ($po1 -and $po1._id) {
  $grn1Body = @{
    grnNumber = "GRN-ENT-201";
    poId = $po1._id;
    sellerId = $msmeSeller._id;
    qualityCheckPassed = $true;
    notes = "Received 550 boxes, 880 labels";
    lineItems = @(
      @{ description = "Corrugated boxes"; orderedQty = 600; acceptedQty = 550; rejectedQty = 50; unitPrice = 180 },
      @{ description = "Thermal labels"; orderedQty = 900; acceptedQty = 880; rejectedQty = 20; unitPrice = 80 }
    );
  }
  Invoke-JsonSafe -Method "POST" -Url "$base/grn" -Body $grn1Body -Session $buyerSession | Out-Null
}

if ($po2 -and $po2._id) {
  $grn2Body = @{
    grnNumber = "GRN-ENT-202";
    poId = $po2._id;
    sellerId = $msmeSeller._id;
    qualityCheckPassed = $true;
    notes = "Partial receipt for gloves and goggles";
    lineItems = @(
      @{ description = "Safety gloves"; orderedQty = 500; acceptedQty = 320; rejectedQty = 0; unitPrice = 90 },
      @{ description = "Safety goggles"; orderedQty = 250; acceptedQty = 180; rejectedQty = 0; unitPrice = 120 }
    );
  }
  Invoke-JsonSafe -Method "POST" -Url "$base/grn" -Body $grn2Body -Session $buyerSession | Out-Null
}

$invListResp = Invoke-RestMethod -Method "GET" -Uri "$base/invoices" -WebSession $sellerSession
$invList = $invListResp.data.invoices
if (-not $invList) { $invList = $invListResp.invoices }

function Get-Or-CreateInvoice {
  param(
    [string]$InvoiceNumber,
    [string]$IssueDate,
    [string]$DeliveryDate,
    [string]$DueDate,
    [decimal]$Subtotal,
    [decimal]$Tax,
    [string]$Status,
    [array]$LineItems
  )

  $existing = $invList | Where-Object { $_.invoiceNumber -eq $InvoiceNumber } | Select-Object -First 1
  if ($existing) { return $existing }

  $body = @{
    invoiceNumber = $InvoiceNumber;
    buyerEmail = $buyerUser.email;
    issueDate = $IssueDate;
    deliveryDate = $DeliveryDate;
    dueDate = $DueDate;
    currency = "INR";
    subtotalAmount = [double]$Subtotal;
    taxAmount = [double]$Tax;
    totalAmount = [double]($Subtotal + $Tax);
    status = $Status;
    notes = "Demo invoice";
    lineItems = $LineItems;
    sendApprovalRequest = $false;
  }

  $resp = Invoke-JsonSafe -Method "POST" -Url "$base/invoices" -Body $body -Session $sellerSession
  return $resp.data.invoice
}

$inv1 = Get-Or-CreateInvoice -InvoiceNumber "INV-ENT-001" -IssueDate "2026-03-15" -DeliveryDate "2026-03-15" -DueDate "2026-04-14" -Subtotal 220000 -Tax 25000 -Status "Pending Approval" -LineItems @(
  @{ description = "Packaging supplies"; quantity = 1; unitPrice = 220000; total = 220000 }
)

$inv2 = Get-Or-CreateInvoice -InvoiceNumber "INV-ENT-002" -IssueDate "2026-03-10" -DeliveryDate "2026-03-10" -DueDate "2026-04-09" -Subtotal 90000 -Tax 8000 -Status "Approved" -LineItems @(
  @{ description = "Plant safety equipment"; quantity = 1; unitPrice = 90000; total = 90000 }
)

$inv3 = Get-Or-CreateInvoice -InvoiceNumber "INV-ENT-003" -IssueDate "2026-03-20" -DeliveryDate "2026-03-20" -DueDate "2026-04-19" -Subtotal 47000 -Tax 4000 -Status "Pending Approval" -LineItems @(
  @{ description = "Logistics support"; quantity = 1; unitPrice = 47000; total = 47000 }
)

$inv4 = Get-Or-CreateInvoice -InvoiceNumber "INV-ENT-004" -IssueDate "2026-02-28" -DeliveryDate "2026-02-28" -DueDate "2026-03-29" -Subtotal 120000 -Tax 12500 -Status "Approved" -LineItems @(
  @{ description = "Consumables"; quantity = 1; unitPrice = 120000; total = 120000 }
)

if ($inv3 -and $inv3._id) {
  Patch-JsonSafe -Url "$base/invoices/$($inv3._id)" -Body @{ disputeReason = "Quantity mismatch in GRN" } -Session $buyerSession | Out-Null
}

if ($inv4 -and $inv4._id) {
  Patch-JsonSafe -Url "$base/invoices/$($inv4._id)" -Body @{ status = "Partially Settled"; amountPaid = 50000 } -Session $buyerSession | Out-Null
}

Write-Output "Demo users and data seeded via API calls."
Write-Output "Buyer: $($buyerUser.email) / $($buyerUser.password)"
Write-Output "Seller: $($sellerUser.email) / $($sellerUser.password)"
