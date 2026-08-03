<?php

namespace App\Repository\Slave;

use App\Entity\Slave\PracticeTag;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PracticeTag>
 */
class PracticeTagRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PracticeTag::class);
    }

    /** True se esiste già un tag con lo stesso valore (case-insensitive). */
    public function valueExists(string $value, ?int $exceptId = null): bool
    {
        $qb = $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->andWhere('LOWER(t.value) = :v')
            ->setParameter('v', mb_strtolower($value));

        if ($exceptId !== null) {
            $qb->andWhere('t.id <> :id')->setParameter('id', $exceptId);
        }

        return ((int) $qb->getQuery()->getSingleScalarResult()) > 0;
    }
}
