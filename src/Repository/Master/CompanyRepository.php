<?php

namespace App\Repository\Master;

use App\Entity\Master\Company;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Company>
 */
class CompanyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Company::class);
    }

    public function findOneByCode(string $code): ?Company
    {
        return $this->findOneBy(['code' => $code]);
    }

    /**
     * Clienti con licenza in scadenza entro $days giorni (incluse già scadute).
     * $demo=true → solo licenze demo (6.1.2); $demo=false → licenze non-demo (6.1.3).
     *
     * @return Company[]
     */
    public function findExpiring(bool $demo, int $days = 30): array
    {
        $limit = new \DateTimeImmutable('today +' . $days . ' days');

        $qb = $this->createQueryBuilder('c')
            ->andWhere('c.licenseExpiresAt IS NOT NULL')
            ->andWhere('c.licenseExpiresAt <= :limit')
            ->setParameter('limit', $limit)
            ->orderBy('c.licenseExpiresAt', 'ASC');

        if ($demo) {
            $qb->andWhere('c.licenseType = :demo')->setParameter('demo', Company::LICENSE_DEMO);
        } else {
            $qb->andWhere('c.licenseType != :demo')->setParameter('demo', Company::LICENSE_DEMO);
        }

        return $qb->getQuery()->getResult();
    }
}
