;; medicine-tracker.clar

(define-data-var medicine-counter uint u0)
(define-map medicine-map { med-id: uint } { manufacturer: principal, current-owner: principal, status: (string-ascii 20), route: (list 10 principal) })

(define-private (is-manufacturer (user principal))
  (is-eq tx-sender user))

(define-public (add-medicine (manufacturer principal) (med-id uint))
  (begin
    (asserts! (is-manufacturer manufacturer) (err u100))
    (let ((med-data { manufacturer: tx-sender, current-owner: tx-sender, status: "manufactured", route: (list tx-sender) }))
      (map-set medicine-map { med-id: med-id } med-data)
      (ok true)
    )
  )
)

(define-public (transfer-medicine (med-id uint) (new-owner principal))
  (begin
    (asserts! (is-eq (get current-owner (map-get medicine-map { med-id: med-id })) tx-sender) (err u101))
    (let ((med-data (unwrap! (map-get medicine-map { med-id: med-id }) (err u102))))
      (map-set medicine-map { med-id: med-id } (merge med-data { current-owner: new-owner, status: "in-transit", route: (append (get route med-data) new-owner) }))
      (ok true)
    )
  )
)

(define-read-only (get-medicine-status (med-id uint))
  (ok (get status (map-get medicine-map { med-id: med-id })))
)

(define-read-only (get-medicine-route (med-id uint))
  (ok (get route (map-get medicine-map { med-id: med-id })))
)

;; Error codes:
;; u100: Only manufacturer can add medicine
;; u101: Only current owner can transfer medicine
;; u102: Medicine not found