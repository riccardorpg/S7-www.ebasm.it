<?php

namespace App\Repository\Slave;

use App\Entity\Slave\Practice;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Practice>
 */
class PracticeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Practice::class);
    }

    /**
     * Query di base per l'elenco pratiche a cui il notaio ha accesso.
     * $notaryEmail: se valorizzato, include solo le pratiche assegnate a quel notaio
     * o senza notaio assegnato (accesso libero).
     */
    public function accessibleQueryBuilder(?string $notaryEmail = null): QueryBuilder
    {
        $qb = $this->createQueryBuilder('p');
        if ($notaryEmail !== null && $notaryEmail !== '') {
            $qb->andWhere('p.notaryEmail IS NULL OR p.notaryEmail = :ne')
                ->setParameter('ne', $notaryEmail);
        }

        return $qb;
    }
}
