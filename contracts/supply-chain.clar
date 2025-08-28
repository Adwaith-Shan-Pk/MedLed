;; supply-chain.clar
(define-map ownership
;; key: batch-id, value: owner principal
(batch-id) (owner))


(define-map transfers
;; keyed by (batch-id, seq) -> tuple (from, to, timestamp)
(tuple (batch-id (buff 32)) (seq uint)) (tuple (from principal) (to principal) (ts uint)))


(define-data-var transfer-counter uint 0)


(define-public (init-transfer (batch-id (buff 32)) (to principal))
(begin
(let ((owner-entry (map-get ownership {batch-id: batch-id})))
(match owner-entry
owner-tuple
(let ((current-owner (get owner owner-tuple)))
(if (is-eq current-owner (tx-sender))
(let ((seq (var-get transfer-counter)))
(map-set transfers {batch-id: batch-id seq: seq} {from: current-owner, to: to, ts: (get-block-height)})
(map-set ownership {batch-id: batch-id} to)
(var-set transfer-counter (+ seq u1))
(ok seq)
)
(err u100)
)
)
(err u101)
)
)
)
)


(define-public (set-initial-owner (batch-id (buff 32)) (owner principal))
(begin
(match (map-get ownership {batch-id: batch-id})
o (err u2)
(map-set ownership {batch-id: batch-id} owner)
)
(ok batch-id)
)
)


(define-read-only (get-owner (batch-id (buff 32)))
(map-get ownership {batch-id: batch-id})
)