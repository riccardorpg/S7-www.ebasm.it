<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * File per i motori di ricerca: robots.txt e sitemap.xml.
 *
 * Sono rotte e non file statici in public/ così gli URL restano generati dal
 * router (niente domini scritti a mano) e la sitemap non può disallinearsi
 * dalle rotte reali. L'.htaccess manda a index.php tutto ciò che non esiste
 * su disco, quindi /robots.txt e /sitemap.xml arrivano qui.
 */
class SeoController extends AbstractController
{
    /**
     * Pagine pubbliche indicizzabili. Tutto il resto (area riservata, login,
     * recupero password, submit dei form) resta fuori dalla sitemap.
     *
     * @var array<string, array{priority: string, changefreq: string}>
     */
    private const PUBLIC_ROUTES = [
        'homepage'      => ['priority' => '1.0', 'changefreq' => 'weekly'],
        'legal_privacy' => ['priority' => '0.3', 'changefreq' => 'yearly'],
        'legal_cookie'  => ['priority' => '0.3', 'changefreq' => 'yearly'],
        'legal_terms'   => ['priority' => '0.3', 'changefreq' => 'yearly'],
    ];

    /**
     * Percorsi esclusi dalla scansione: area riservata, autenticazione e
     * /home/{section}, che è solo un redirect alla homepage (contenuto doppio).
     *
     * @var string[]
     */
    private const DISALLOWED_PATHS = [
        '/amministratore',
        '/agenzia',
        '/notaio',
        '/accedi',
        '/accesso-staff',
        '/accesso-verifica',
        '/disconnetti',
        '/recupera-password',
        '/crea-password',
        '/contatti/invia',
        '/demo/richiedi',
        '/home/',
    ];

    #[Route('/robots.txt', name: 'robots_txt', methods: ['GET'])]
    public function robots(): Response
    {
        // Fuori produzione blocchiamo tutto: niente indicizzazione di dev e staging.
        $isProd = $this->getParameter('kernel.environment') === 'prod';

        $response = $this->render('seo/robots.txt.twig', [
            'allowCrawling' => $isProd,
            'disallowed'    => self::DISALLOWED_PATHS,
            'sitemapUrl'    => $this->generateUrl('sitemap_xml', [], UrlGeneratorInterface::ABSOLUTE_URL),
        ]);
        $response->headers->set('Content-Type', 'text/plain; charset=UTF-8');

        return $response;
    }

    #[Route('/sitemap.xml', name: 'sitemap_xml', methods: ['GET'])]
    public function sitemap(): Response
    {
        $urls = [];
        foreach (self::PUBLIC_ROUTES as $route => $meta) {
            $urls[] = [
                'loc'        => $this->generateUrl($route, [], UrlGeneratorInterface::ABSOLUTE_URL),
                'priority'   => $meta['priority'],
                'changefreq' => $meta['changefreq'],
            ];
        }

        $response = $this->render('seo/sitemap.xml.twig', [
            'urls' => $urls,
        ]);
        $response->headers->set('Content-Type', 'application/xml; charset=UTF-8');

        return $response;
    }
}
