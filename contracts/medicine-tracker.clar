;; Medicine Tracker Smart Contract
;; Tracks medicines from manufacturer to pharmacy

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))
(define-constant err-unauthorized (err u103))
(define-constant err-invalid-status (err u104))

;; Data Variables
(define-data-var next-med-id uint u1)

;; Data Maps
(define-map medicines
  { med-id: uint }
  {
    name: (string-ascii 100),
    manufacturer: principal,
    batch-number: (string-ascii 50),
    manufacturing-date: uint,
    expiry-date: uint,
    current-location: (string-ascii 100),
    status: (string-ascii 20),
    created-at: uint
  }
)

(define-map medicine-route
  { med-id: uint, step: uint }
  {
    location: (string-ascii 100),
    handler: principal,
    timestamp: uint,
    status: (string-ascii 20)
  }
)

(define-map authorized-entities
  { entity: principal }
  { role: (string-ascii 20), active: bool }
)

(define-map medicine-verification
  { med-id: uint }
  {
    is-authentic: bool,
    verification-count: uint,
    last-verified: uint
  }
)

;; Authorization Functions
(define-public (add-authorized-entity (entity principal) (role (string-ascii 20)))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (map-set authorized-entities { entity: entity } { role: role, active: true }))
  )
)

(define-read-only (is-authorized (entity principal) (required-role (string-ascii 20)))
  (match (map-get? authorized-entities { entity: entity })
    auth-data (and (get active auth-data) (is-eq (get role auth-data) required-role))
    false
  )
)

;; Medicine Registration
(define-public (register-medicine 
  (name (string-ascii 100))
  (batch-number (string-ascii 50))
  (manufacturing-date uint)
  (expiry-date uint)
  (initial-location (string-ascii 100))
)
  (let ((med-id (var-get next-med-id)))
    (asserts! (is-authorized tx-sender "manufacturer") err-unauthorized)
    (asserts! (is-none (map-get? medicines { med-id: med-id })) err-already-exists)
    
    ;; Register medicine
    (map-set medicines
      { med-id: med-id }
      {
        name: name,
        manufacturer: tx-sender,
        batch-number: batch-number,
        manufacturing-date: manufacturing-date,
        expiry-date: expiry-date,
        current-location: initial-location,
        status: "manufactured",
        created-at: block-height
      }
    )
    
    ;; Add initial route entry
    (map-set medicine-route
      { med-id: med-id, step: u0 }
      {
        location: initial-location,
        handler: tx-sender,
        timestamp: block-height,
        status: "manufactured"
      }
    )
    
    ;; Initialize verification
    (map-set medicine-verification
      { med-id: med-id }
      {
        is-authentic: true,
        verification-count: u0,
        last-verified: block-height
      }
    )
    
    (var-set next-med-id (+ med-id u1))
    (ok med-id)
  )
)

;; Update Medicine Location
(define-public (update-medicine-location 
  (med-id uint)
  (new-location (string-ascii 100))
  (new-status (string-ascii 20))
  (step uint)
)
  (let ((medicine (unwrap! (map-get? medicines { med-id: med-id }) err-not-found)))
    (asserts! (or 
      (is-authorized tx-sender "distributor")
      (is-authorized tx-sender "pharmacy")
      (is-authorized tx-sender "manufacturer")
    ) err-unauthorized)
    
    ;; Update medicine current location
    (map-set medicines
      { med-id: med-id }
      (merge medicine {
        current-location: new-location,
        status: new-status
      })
    )
    
    ;; Add route entry
    (map-set medicine-route
      { med-id: med-id, step: step }
      {
        location: new-location,
        handler: tx-sender,
        timestamp: block-height,
        status: new-status
      }
    )
    
    (ok true)
  )
)

;; Verify Medicine Authenticity
(define-public (verify-medicine (med-id uint))
  (let (
    (medicine (unwrap! (map-get? medicines { med-id: med-id }) err-not-found))
    (verification (unwrap! (map-get? medicine-verification { med-id: med-id }) err-not-found))
  )
    (asserts! (or 
      (is-authorized tx-sender "pharmacy")
      (is-authorized tx-sender "regulator")
    ) err-unauthorized)
    
    (map-set medicine-verification
      { med-id: med-id }
      (merge verification {
        verification-count: (+ (get verification-count verification) u1),
        last-verified: block-height
      })
    )
    
    (ok (get is-authentic verification))
  )
)

;; Mark Medicine as Fake
(define-public (mark-fake-medicine (med-id uint))
  (let ((verification (unwrap! (map-get? medicine-verification { med-id: med-id }) err-not-found)))
    (asserts! (is-authorized tx-sender "regulator") err-unauthorized)
    
    (map-set medicine-verification
      { med-id: med-id }
      (merge verification {
        is-authentic: false,
        last-verified: block-height
      })
    )
    
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-medicine (med-id uint))
  (map-get? medicines { med-id: med-id })
)

(define-read-only (get-medicine-route (med-id uint) (step uint))
  (map-get? medicine-route { med-id: med-id, step: step })
)

(define-read-only (get-medicine-verification (med-id uint))
  (map-get? medicine-verification { med-id: med-id })
)

(define-read-only (get-next-med-id)
  (var-get next-med-id)
)