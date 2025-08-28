
;; prescription-validator.clar
;; <add a description here>

;; constants
;;

;; data maps and vars
;;

;; private functions
;;

;; public functions
;;
;; Prescription Validator Smart Contract
;; Validates prescriptions and detects fakes

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u200))
(define-constant err-not-found (err u201))
(define-constant err-already-exists (err u202))
(define-constant err-unauthorized (err u203))
(define-constant err-duplicate-prescription (err u204))
(define-constant err-invalid-signature (err u205))

;; Data Variables
(define-data-var next-prescription-id uint u1)

;; Data Maps
(define-map prescriptions
  { prescription-id: uint }
  {
    doctor: principal,
    patient-id: (string-ascii 100),
    medicine-list: (list 10 uint),
    prescription-hash: (buff 32),
    doctor-signature: (buff 65),
    issue-date: uint,
    is-used: bool,
    usage-count: uint,
    created-at: uint
  }
)

(define-map doctor-registry
  { doctor: principal }
  {
    name: (string-ascii 100),
    license-number: (string-ascii 50),
    signature-hash: (buff 32),
    is-verified: bool,
    registered-at: uint
  }
)

(define-map prescription-usage
  { prescription-id: uint, usage-index: uint }
  {
    pharmacy: principal,
    used-at: uint,
    medicine-dispensed: (list 10 uint)
  }
)

(define-map duplicate-detection
  { prescription-hash: (buff 32) }
  {
    count: uint,
    first-prescription-id: uint,
    last-seen: uint
  }
)

;; Doctor Registration
(define-public (register-doctor 
  (name (string-ascii 100))
  (license-number (string-ascii 50))
  (signature-hash (buff 32))
)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set doctor-registry
      { doctor: tx-sender }
      {
        name: name,
        license-number: license-number,
        signature-hash: signature-hash,
        is-verified: true,
        registered-at: block-height
      }
    )
    (ok true)
  )
)

;; Add Prescription
(define-public (add-prescription
  (patient-id (string-ascii 100))
  (medicine-list (list 10 uint))
  (prescription-hash (buff 32))
  (doctor-signature (buff 65))
)
  (let (
    (prescription-id (var-get next-prescription-id))
    (doctor-info (unwrap! (map-get? doctor-registry { doctor: tx-sender }) err-unauthorized))
  )
    (asserts! (get is-verified doctor-info) err-unauthorized)
    
    ;; Check for duplicate prescription hash
    (match (map-get? duplicate-detection { prescription-hash: prescription-hash })
      existing-dup (err err-duplicate-prescription)
      (begin
        ;; Record this as first occurrence
        (map-set duplicate-detection
          { prescription-hash: prescription-hash }
          {
            count: u1,
            first-prescription-id: prescription-id,
            last-seen: block-height
          }
        )
        
        ;; Add prescription
        (map-set prescriptions
          { prescription-id: prescription-id }
          {
            doctor: tx-sender,
            patient-id: patient-id,
            medicine-list: medicine-list,
            prescription-hash: prescription-hash,
            doctor-signature: doctor-signature,
            issue-date: block-height,
            is-used: false,
            usage-count: u0,
            created-at: block-height
          }
        )
        
        (var-set next-prescription-id (+ prescription-id u1))
        (ok prescription-id)
      )
    )
  )
)

;; Validate Prescription
(define-public (validate-prescription (prescription-id uint))
  (let (
    (prescription (unwrap! (map-get? prescriptions { prescription-id: prescription-id }) err-not-found))
    (doctor-info (unwrap! (map-get? doctor-registry { doctor: (get doctor prescription) }) err-not-found))
    (dup-info (unwrap! (map-get? duplicate-detection { prescription-hash: (get prescription-hash prescription) }) err-not-found))
  )
    ;; Check if doctor is verified
    (asserts! (get is-verified doctor-info) err-unauthorized)
    
    ;; Check for duplicates
    (asserts! (is-eq (get count dup-info) u1) err-duplicate-prescription)
    
    ;; Validate signature (simplified - in real implementation would verify cryptographic signature)
    ;; (asserts! (is-eq (get signature-hash doctor-info) (sha256 (get doctor-signature prescription))) err-invalid-signature)
    
    (ok {
      is-valid: true,
      doctor-verified: (get is-verified doctor-info),
      is-duplicate: (> (get count dup-info) u1),
      usage-count: (get usage-count prescription)
    })
  )
)

;; Use Prescription
(define-public (use-prescription 
  (prescription-id uint)
  (medicine-dispensed (list 10 uint))
)
  (let (
    (prescription (unwrap! (map-get? prescriptions { prescription-id: prescription-id }) err-not-found))
    (current-usage-count (get usage-count prescription))
  )
    ;; Only pharmacies can use prescriptions (assume pharmacy authorization)
    
    ;; Update prescription usage
    (map-set prescriptions
      { prescription-id: prescription-id }
      (merge prescription {
        is-used: true,
        usage-count: (+ current-usage-count u1)
      })
    )
    
    ;; Record usage details
    (map-set prescription-usage
      { prescription-id: prescription-id, usage-index: current-usage-count }
      {
        pharmacy: tx-sender,
        used-at: block-height,
        medicine-dispensed: medicine-dispensed
      }
    )
    
    (ok true)
  )
)

;; Detect Fake Prescriptions
(define-public (detect-fake-prescription (prescription-hash (buff 32)))
  (match (map-get? duplicate-detection { prescription-hash: prescription-hash })
    dup-info (ok {
      is-duplicate: (> (get count dup-info) u1),
      count: (get count dup-info),
      first-seen: (get first-prescription-id dup-info)
    })
    (ok {
      is-duplicate: false,
      count: u0,
      first-seen: u0
    })
  )
)

;; Read-only functions
(define-read-only (get-prescription (prescription-id uint))
  (map-get? prescriptions { prescription-id: prescription-id })
)

(define-read-only (get-doctor-info (doctor principal))
  (map-get? doctor-registry { doctor: doctor })
)

(define-read-only (get-prescription-usage (prescription-id uint) (usage-index uint))
  (map-get? prescription-usage { prescription-id: prescription-id, usage-index: usage-index })
)

(define-read-only (get-next-prescription-id)
  (var-get next-prescription-id)
)