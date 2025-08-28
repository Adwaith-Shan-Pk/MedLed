;; prescription-verifier.clar

(define-map prescription-map { prescription-hash: (string-ascii 64) } { doctor: principal, patient: principal, is-used: bool })

(define-public (add-prescription-hash (prescription-hash (string-ascii 64)) (doctor principal) (patient principal))
  (begin
    (asserts! (is-none (map-get prescription-map { prescription-hash: prescription-hash })) (err u200))
    (map-set prescription-map { prescription-hash: prescription-hash } { doctor: doctor, patient: patient, is-used: false })
    (ok true)
  )
)

(define-public (use-prescription (prescription-hash (string-ascii 64)))
  (begin
    (asserts! (is-some (map-get prescription-map { prescription-hash: prescription-hash })) (err u201))
    (let ((prescription-data (unwrap! (map-get prescription-map { prescription-hash: prescription-hash }) (err u201))))
      (asserts! (is-eq (get is-used prescription-data) false) (err u202))
      (map-set prescription-map { prescription-hash: prescription-hash } (merge prescription-data { is-used: true }))
      (ok true)
    )
  )
)

(define-read-only (check-prescription-hash (prescription-hash (string-ascii 64)))
  (ok (get is-used (map-get prescription-map { prescription-hash: prescription-hash })))
)

(define-read-only (get-prescription-details (prescription-hash (string-ascii 64)))
  (ok (map-get prescription-map { prescription-hash: prescription-hash }))
)

;; Error codes:
;; u200: Prescription hash already exists
;; u201: Prescription hash not found
;; u202: Prescription already used