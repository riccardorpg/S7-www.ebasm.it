<?php

namespace App\Repository\Slave;

use App\Entity\Slave\DocumentType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DocumentType>
 */
class DocumentTypeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DocumentType::class);
    }

    /**
     * 13.1.1 Elenco completo nell'ordine deciso col drag & drop.
     *
     * @return DocumentType[]
     */
    public function findOrdered(): array
    {
        return $this->createQueryBuilder('t')
            ->orderBy('t.priority', 'ASC')
            ->addOrderBy('t.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /** Priorità successiva all'ultima occupata: serve ad accodare i nuovi tipi. */
    public function nextPriority(): int
    {
        $max = $this->createQueryBuilder('t')
            ->select('MAX(t.priority)')
            ->getQuery()
            ->getSingleScalarResult();

        return $max === null ? 0 : ((int) $max) + 1;
    }

    /** True se esiste già un tipo con lo stesso valore (confronto case-insensitive). */
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
