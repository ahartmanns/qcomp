(define (problem ex_bw_10_p08)
  (:domain exploding-blocksworld)
  (:objects b1 b2 b3 b4 b5 b6 b7 b8 b9 b10 - block)
  (:init (= (total-cost) 0)  (emptyhand) (on b1 b8) (on b2 b4) (on b3 b10) (on b4 b5) (on b5 b6) (on b6 b9) (on b7 b2) (on-table b8) (on b9 b1) (on-table b10) (clear b3) (clear b7) (no-detonated b1) (no-destroyed b1) (no-detonated b2) (no-destroyed b2) (no-detonated b3) (no-destroyed b3) (no-detonated b4) (no-destroyed b4) (no-detonated b5) (no-destroyed b5) (no-detonated b6) (no-destroyed b6) (no-detonated b7) (no-destroyed b7) (no-detonated b8) (no-destroyed b8) (no-detonated b9) (no-destroyed b9) (no-detonated b10) (no-destroyed b10) (no-destroyed-table))
  (:goal (and  (on b1 b6) (on b3 b1) (on b5 b8) (on b6 b4) (on b7 b3) (on b8 b7) (on-table b9) (on b10 b5)  )
)
  
)
