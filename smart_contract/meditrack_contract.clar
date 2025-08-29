;; MediTrack: A simple medicine tracking smart contract for a hackathon.
;; This contract allows for the registration, transfer, and verification of medicines
;; to ensure authenticity throughout the supply chain.

;; --- Constants and Errors ---
;; Define the principal of the manufacturer.
;; IMPORTANT: Replace 'SP2J6B00000000000000000000000000000AJQ' with YOUR Stacks wallet address.
(define-constant manufacturer 'STFCKZCBDQ0T5GB5FKBQYFKT0GTZDN42TMBX3FRF)

;; Error codes for contract calls
(define-constant ERR-NOT-AUTHORIZED (err u101))
(define-constant ERR-MEDICINE-NOT-FOUND (err u102))
(define-constant ERR-MEDICINE-ALREADY-REGISTERED (err u103))
(define-constant ERR-JOURNEY-COMPLETED (err u104)) ;; New error for completed journeys

;; --- Data Storage ---
;; A map to store the details of each medicine packet.
;; The key is a unique uint (unsigned integer) ID for the medicine.
(define-map medicines uint {
  manufacturer: principal,
  current-owner: principal,
  batch-number: (string-ascii 64),
  status: (string-ascii 64)
})

;; --- Public Functions ---

;; @desc Registers a new medicine packet on the blockchain.
;; @param id: A unique ID for the medicine packet.
;; @param batch-number: The batch number from the manufacturer.
;; @returns (ok bool) or (err uint)
;; Can only be called by the designated manufacturer principal.
(define-public (register-medicine (id uint) (batch-number (string-ascii 64)))
  (begin
    ;; Assert that the caller is the manufacturer
    (asserts! (is-eq tx-sender manufacturer) ERR-NOT-AUTHORIZED)
    
    ;; Assert that the medicine ID is not already in use
    (asserts! (is-none (map-get? medicines id)) ERR-MEDICINE-ALREADY-REGISTERED)
    
    ;; Store the new medicine's data in the map
    (map-set medicines id {
      manufacturer: tx-sender,
      current-owner: tx-sender,
      batch-number: batch-number,
      status: "Registered by Manufacturer"
    })
    
    ;; Print an event for easier tracking off-chain
    (print { type: "medicine-registration", id: id, batch: batch-number })
    
    (ok true)
  )
)

;; @desc Transfers ownership of a medicine packet.
;; @param id: The ID of the medicine to transfer.
;; @param new-owner: The principal address of the new owner.
;; @param recipient-role: The role of the recipient (e.g., "distributor", "pharmacy").
;; @returns (ok bool) or (err uint)
;; Can only be called by the current owner of the medicine.
(define-public (transfer-medicine (id uint) (new-owner principal) (recipient-role (string-ascii 64)))
  (let ((medicine-details (unwrap! (map-get? medicines id) ERR-MEDICINE-NOT-FOUND)))
    
    ;; Assert that the caller is the current owner of the medicine
    (asserts! (is-eq tx-sender (get current-owner medicine-details)) ERR-NOT-AUTHORIZED)
    
    ;; Assert that the journey is not already completed
    (asserts! (not (is-eq (get status medicine-details) "Journey Completed")) ERR-JOURNEY-COMPLETED)
    
    ;; Determine the new status based on the recipient's role
    (let ((new-status (if (is-eq recipient-role "pharmacy")
                               "Journey Completed"
                               "In Transit")))
      
      ;; Update the medicine's details with the new owner and status
      (map-set medicines id
        (merge medicine-details {
          current-owner: new-owner,
          status: new-status
        })
      )
      
      ;; Print an event for the transfer, including the new role
      (print { type: "medicine-transfer", id: id, from: tx-sender, to: new-owner, role: recipient-role })
      
      (ok true)
    )
  )
)


;; --- Read-Only Functions ---

;; @desc Verifies the details of a medicine packet.
;; @param id: The ID of the medicine to verify.
;; @returns (some {manufacturer: principal, current-owner: principal, ...}) or none
;; Anyone can call this function without a transaction fee.
(define-read-only (verify-medicine (id uint))
  (map-get? medicines id)
)