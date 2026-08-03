<?php

namespace App\Repository\Slave;

use App\Entity\Slave\PracticeMark;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PracticeMark>
 */
class PracticeMarkRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PracticeMark::class);
    }

    /** True se esiste già un contrassegno con lo stesso valore (case-insensitive). */
    public function valueExists(string $value, ?int $exceptId = null): bool
    {
        $qb = $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->andWhere('LOWER(m.value) = :v')
            ->setParameter('v', mb_strtolower($value));

        if ($exceptId !== null) {
            $qb->andWhere('m.id <> :id')->setParameter('id', $exceptId);
        }

        return ((int) $qb->getQuery()->getSingleScalarResult()) > 0;
    }
}
