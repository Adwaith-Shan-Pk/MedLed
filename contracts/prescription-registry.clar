;; prescription-registry.clar
(define-map prescriptions
;; key: presc-hash (buff 32) -> value: tuple (doctor principal) (patient-hash (buff 32)) (issued uint) (valid-until uint) (allowed uint) (redeemed uint)
(presc-hash) (tuple (doctor principal) (patient-hash (buff 32)) (issued uint) (valid-until uint) (allowed uint) (redeemed uint)))


(define-public (register-prescription (presc-hash (buff 32)) (patient-hash (buff 32)) (valid-until uint) (allowed uint))
;; caller (tx-sender) is treated as doctor
(begin
(match (map-get prescriptions {presc-hash: presc-hash})
entry (err u1)
(let ((now (get-block-height)))
(map-set prescriptions {presc-hash: presc-hash}
{doctor: (tx-sender), patient-hash: patient-hash, issued: now, valid-until: valid-until, allowed: allowed, redeemed: u0})
(ok presc-hash)
)
)
)
)


(define-read-only (get-prescription (presc-hash (buff 32)))
(map-get prescriptions {presc-hash: presc-hash})
)


(define-public (redeem-prescription (presc-hash (buff 32)) (qty uint))
(begin
(match (map-get prescriptions {presc-hash: presc-hash})
presc
(let ((now (get-block-height)))
(let ((valid-until (get valid-until presc)) (redeemed (get redeemed presc)) (allowed (get allowed presc)))
(if (>= now valid-until)
(err u3) ;; expired
(if (>= (+ redeemed qty) allowed)
(err u4) ;; would exceed allowed
(begin
(map-set prescriptions {presc-hash: presc-hash} {doctor: (get doctor presc), patient-hash: (get patient-hash presc), issued: (get issued presc), valid-until: valid-until, allowed: allowed, redeemed: (+ redeemed qty)})
(ok qty)
)
)
)
)
)
(err u2)
)
)
)