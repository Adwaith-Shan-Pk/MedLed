;; medicine-registry.clar
(define-public (hello) (ok "hi"))


(define-map batches
;; key: batch-id (buff), value: (tuple (manufacturer principal) (expiry uint) (meta-hash (buff 32))))
(batch-id) (tuple (manufacturer principal) (expiry uint) (meta-hash (buff 32))))


(define-public (register-batch (batch-id (buff 32)) (expiry uint) (meta-hash (buff 32)))
(begin
(match (map-get batches {batch-id: batch-id})
entry (err u1)
(map-set batches {batch-id: batch-id} {manufacturer: (tx-sender), expiry: expiry, meta-hash: meta-hash})
)
(ok batch-id)
)
)


(define-read-only (get-batch (batch-id (buff 32)))
(map-get batches {batch-id: batch-id})
)